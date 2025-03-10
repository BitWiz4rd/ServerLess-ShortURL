# 🔗 ServerLess-ShortURL

A serverless URL shortener built on AWS Lambda, API Gateway, and DynamoDB. Automatically scales to handle traffic spikes while keeping costs near-zero for low usage. Lightweight, event-driven URL management.

![AWS Serverless Architecture](https://img.shields.io/badge/Architecture-Serverless-ff9900?style=flat&logo=amazon-aws) 
![License](https://img.shields.io/github/license/BitWiz4rd/ServerLess-ShortURL?style=flat)

## ✨ Features
- **No servers to manage** – Fully serverless (AWS Lambda + API Gateway)
- **Millisecond redirects** – Optimized DynamoDB lookup
- **Auto-scaling** – Handles traffic spikes effortlessly
- **Pay-per-use pricing** – Costs pennies for low/moderate usage
- **REST API** – Simple integration with existing systems

## 🛠️ Architecture 
```plaintext
User → API Gateway → Lambda → DynamoDB (Short URL Storage)
               │
               └→ Lambda (Redirect Handler)
