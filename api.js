// Module Imports
const url = require('url')
const AWS = require('aws-sdk')
const S3 = new AWS.S3({
  sslEnabled: true,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.ACCESS_SECRET_KEY,
  Bucket: process.env.BUCKET_NAME
})
var config = new AWS.Config({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.ACCESS_SECRET_KEY,
  region: 'us-west-2',
  Bucket: process.env.BUCKET_NAME
});

// Function to validate Long URLs
function validate(longUrl) {
  // Reject promise in case Long URL is empty
  if (longUrl === '') {
    return Promise.reject({ statusCode: 400, message: 'URL is required' })
  }

  // Parse Long URL
  let parsedUrl = url.parse(longUrl)

  // Reject promise in case protocol is null or host is null
  if (parsedUrl.protocol === null || parsedUrl.host === null) {
    return Promise.reject({ statusCode: 400, message: 'URL is invalid' })
  }

  // If all is OK, resolve the Long URL
  return Promise.resolve(longUrl)
}

// Functionto check if path (unique code) is already taken
function isPathFree(path) {
  console.log('Checking if path is free')
  const params = buildRedirect(path)
  console.log(params)
  return S3.headObject(params).promise().then(() => Promise.resolve(false)).catch(function (err) {
    if (err.code == 'NotFound') {
      return Promise.resolve(true)
    }
    else {
      return Promise.reject(err)
    }
  })
}

function buildRedirect(path, longUrl = false) {
  console.log('Building redirect')
  let redirect = {
    Bucket: process.env.BUCKET_NAME,
    'Key': path
  }
  if (longUrl) {
    redirect['WebsiteRedirectLocation'] = longUrl
  }
  return redirect
}

function getPath() {
  console.log('Getting path')
  return new Promise(function (resolve, reject) {
    let path = generatePath()
    isPathFree(path).then(function (isFree) {
      return isFree ? resolve(path) : resolve(getPath())
    })
  })
}

function saveRedirect(redirect) {
  console.log('Saving redirect')
  return S3.putObject(redirect)
    .promise()
    .then(() => Promise.resolve(redirect['Key']))
    .catch(() => Promise.reject({
      statusCode: 500,
      message: 'Error saving redirect'
    }));
}


// Function to generate random & unique code
function generatePath(path = '') {
  console.log('Generating path')
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let position = Math.floor(Math.random() * characters.length)
  let character = characters.charAt(position)
  if (path.length === 7) {
    return path
  }
  return generatePath(path + character)
}

// Function to build response
function buildResponse(statusCode, message, path = false) {
  console.log('Building response')
  let body = { message }
  if (path) body['path'] = path
  return {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    statusCode: statusCode,
    body: JSON.stringify(body)
  }
}

exports.handle = (event, context, callback) => {
  console.log(event)
  let longUrl = ''
  if (event.body !== null) {
    longUrl = JSON.parse(event.body).url || ''
  }
  validate(longUrl).then(function () {
    return getPath()
  }).then(function (path) {
    let redirect = buildRedirect(path, longUrl)
    return saveRedirect(redirect)
  }).then(function (path) {
    let response = buildResponse(200, 'success', path)
    return Promise.resolve(response)
  }).catch(function (err) {
    let response = buildResponse(err.statusCode, err.message)
    return Promise.resolve(response)
  }).then(function (response) {
    callback(null, response)
  })
}
