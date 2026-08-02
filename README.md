# Ecommerce API

A production-ready serverless REST API for an e-commerce store, built on AWS using SAM (Serverless Application Model).

## Architecture

```
Client Request
    → API Gateway (REST API + Cognito Authorizer)
        → Lambda (Node.js 20.x)
            → DynamoDB (single-table design)
                → CloudWatch (monitoring + alarms)
                    → X-Ray (distributed tracing)
```

## Endpoints

All endpoints require a valid Cognito JWT token in the `Authorization` header.

| Method | Path | Description |
|--------|------|-------------|
| POST | /products | Create a product |
| GET | /products | List all products |
| GET | /products/{id} | Get a single product |
| PUT | /products/{id} | Update a product |
| DELETE | /products/{id} | Delete a product |

## Tech Stack

- **Runtime**: Node.js 20.x
- **IaC**: AWS SAM / CloudFormation
- **Database**: DynamoDB (PAY_PER_REQUEST, single-table design with PK/SK)
- **Auth**: Cognito User Pool with JWT authorizer
- **Monitoring**: CloudWatch dashboard (invocations, errors, latency) + error alarm
- **Tracing**: X-Ray enabled on Lambda and API Gateway
- **CI/CD**: CodePipeline + CodeBuild (auto-deploys on push to main)

## DynamoDB Key Design

| Entity | PK | SK |
|--------|----|----|
| Product | `PRODUCT` | `PROD#<uuid>` |

This design supports two access patterns:
- **Get one product**: `GetCommand` with exact PK + SK
- **List all products**: `QueryCommand` on `PK = "PRODUCT"`

## Project Structure

```
ecommerce-api/
├── template.yaml          # SAM template (entire app stack)
├── pipeline.yaml          # CI/CD pipeline stack
├── buildspec.yml          # CodeBuild instructions
├── samconfig.toml         # SAM deploy configuration
├── src/
│   ├── package.json
│   └── handlers/
│       ├── createProduct.mjs
│       ├── getProducts.mjs
│       ├── getProduct.mjs
│       ├── updateProduct.mjs
│       └── deleteProduct.mjs
└── events/                # Sample test events
```

## Prerequisites

- Node.js 20.x
- AWS CLI (configured with IAM credentials)
- SAM CLI
- A GitHub account with the repo connected via CodeStar Connections

## Local Development

```bash
# Build the project
sam build

# Test a single function locally
sam local invoke CreateProductFunction -e events/create.json

# Run the full API locally
sam local start-api
```

## Deployment

The CI/CD pipeline auto-deploys on every push to `main`. For manual deployment:

```bash
sam build
sam deploy
```

## Authentication

### Create a user

```bash
aws cognito-idp sign-up \
  --client-id <UserPoolClientId> \
  --username user@example.com \
  --password YourPassword1! \
  --region us-east-1
```

### Confirm the user

```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id <UserPoolId> \
  --username user@example.com \
  --region us-east-1
```

### Get a token

```bash
aws cognito-idp initiate-auth \
  --client-id <UserPoolClientId> \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=user@example.com,PASSWORD=YourPassword1! \
  --region us-east-1
```

Use the returned `IdToken` in the `Authorization` header for all API requests.

## Testing the API

```bash
# Create a product
curl -X POST https://<api-url>/Prod/products/ \
  -H "Content-Type: application/json" \
  -H "Authorization: <IdToken>" \
  -d '{"name": "Laptop", "price": 999.99, "description": "Gaming laptop"}'

# List all products
curl https://<api-url>/Prod/products/ \
  -H "Authorization: <IdToken>"

# Get one product
curl https://<api-url>/Prod/products/<id> \
  -H "Authorization: <IdToken>"

# Update a product
curl -X PUT https://<api-url>/Prod/products/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: <IdToken>" \
  -d '{"name": "Laptop Pro", "price": 1299.99, "description": "Upgraded"}'

# Delete a product
curl -X DELETE https://<api-url>/Prod/products/<id> \
  -H "Authorization: <IdToken>"
```

## IAM Permissions (Least Privilege)

| Function | Policy |
|----------|--------|
| CreateProductFunction | DynamoDBWritePolicy |
| GetProductsFunction | DynamoDBReadPolicy |
| GetProductFunction | DynamoDBReadPolicy |
| UpdateProductFunction | DynamoDBCrudPolicy |
| DeleteProductFunction | DynamoDBCrudPolicy |

## Monitoring

- **CloudWatch Dashboard**: `ecommerce-api-dashboard` — tracks invocations, errors, and latency across all functions
- **CloudWatch Alarm**: `ecommerce-api-high-errors` — triggers when Lambda errors exceed 5 in a 5-minute window
- **X-Ray**: Service map and trace analysis available in CloudWatch → X-Ray traces

## Teardown

```bash
# Delete the CI/CD pipeline
aws cloudformation delete-stack --stack-name ecommerce-api-pipeline --region us-east-1

# Delete the application stack
sam delete --stack-name ecommerce-api --region us-east-1
```