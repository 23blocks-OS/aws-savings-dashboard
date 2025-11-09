# Infrastructure as Code - Terraform

This directory contains Terraform configurations for deploying the AWS Savings Dashboard infrastructure.

## Prerequisites

- Terraform >= 1.5
- AWS CLI configured with appropriate credentials
- Backend code built in `../Backend/dist/`

## Structure

```
IaC/
├── main.tf                 # Main configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── providers.tf            # AWS provider configuration
├── backend.tf              # Terraform state backend
├── terraform.tfvars.example # Example variables file
└── modules/
    ├── api/                # API Gateway + Lambda module
    │   ├── main.tf
    │   ├── methods.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── cors/           # CORS configuration module
    └── dashboard/          # S3 + CloudFront module
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Quick Start

### 1. Configure Variables

```bash
# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
vi terraform.tfvars
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Apply Configuration

```bash
terraform apply
```

### 5. Get Outputs

```bash
terraform output
```

## Variables

### Required Variables

- `config_table_name`: DynamoDB table name for Instance Scheduler (default: `InstanceScheduler-ConfigTable`)

### Optional Variables

- `aws_region`: AWS region (default: `us-east-1`)
- `environment`: Environment name (default: `prod`)
- `project_name`: Project name (default: `aws-savings-dashboard`)
- `schedule_tag_name`: Schedule tag name (default: `Schedule`)
- `lambda_timeout`: Lambda timeout in seconds (default: `30`)
- `lambda_memory_size`: Lambda memory in MB (default: `512`)

See `variables.tf` for full list.

## Outputs

After deployment, Terraform will output:

- `api_url`: API Gateway invoke URL
- `dashboard_url`: CloudFront distribution URL
- `s3_bucket_name`: S3 bucket name
- `lambda_function_name`: Lambda function name

## Deployment Steps

### Step 1: Build Backend

```bash
cd ../Backend
npm install
npm run build
cd ../IaC
```

This creates `../Backend/dist/` with compiled Lambda code.

### Step 2: Initialize and Deploy

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

### Step 3: Upload Frontend

After Terraform creates the S3 bucket:

```bash
cd ../WebDashboard

# Build frontend
npm run build

# Get bucket name from Terraform output
BUCKET_NAME=$(cd ../IaC && terraform output -raw s3_bucket_name)

# Upload to S3
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(cd ../IaC && terraform output -raw cloudfront_distribution_id)

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Remote State Backend

For team collaboration, configure remote state in `backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "aws-savings-dashboard/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

Create the backend resources:

```bash
# Create S3 bucket for state
aws s3 mb s3://your-terraform-state-bucket --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

Then run:

```bash
terraform init -migrate-state
```

## Workspaces

Use workspaces for multiple environments:

```bash
# Create dev workspace
terraform workspace new dev

# Switch to dev
terraform workspace select dev

# Deploy dev environment
terraform apply -var="environment=dev"

# Switch back to prod
terraform workspace select default
```

## Modules

### API Module

Creates:
- Lambda function for API handlers
- API Gateway REST API with all endpoints
- IAM roles and policies
- CloudWatch log groups

### Dashboard Module

Creates:
- S3 bucket for static hosting
- CloudFront distribution
- Origin Access Identity
- Bucket policies

## Updating Infrastructure

### Update Lambda Code

```bash
# Rebuild backend
cd ../Backend
npm run build
cd ../IaC

# Taint Lambda to force update
terraform taint module.api.aws_lambda_function.api_function

# Apply changes
terraform apply
```

### Update Frontend

```bash
cd ../WebDashboard
npm run build

BUCKET_NAME=$(cd ../IaC && terraform output -raw s3_bucket_name)
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

DISTRIBUTION_ID=$(cd ../IaC && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

## Destroying Resources

To remove all infrastructure:

```bash
terraform destroy
```

⚠️ **Warning**: This will delete all resources including the S3 bucket and its contents.

## Troubleshooting

### Lambda Package Not Found

**Error**: `Error creating lambda.zip: no such file or directory`

**Solution**: Build the backend first:
```bash
cd ../Backend && npm run build && cd ../IaC
```

### API Gateway 403 Error

**Error**: API requests return 403

**Solution**: Check Lambda permissions:
```bash
terraform apply -refresh-only
```

### S3 Bucket Already Exists

**Error**: `BucketAlreadyExists`

**Solution**: Change `project_name` in `terraform.tfvars` or delete the existing bucket.

### CloudFront Takes Long to Deploy

CloudFront distributions can take 15-30 minutes to deploy. This is normal.

## Cost Estimation

Run Terraform cost estimation with Infracost:

```bash
# Install Infracost
brew install infracost  # macOS
# or curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh

# Generate cost estimate
infracost breakdown --path .
```

Expected monthly cost: ~$7-15/month

## Security Best Practices

1. **Never commit `terraform.tfvars`** - Contains sensitive values
2. **Use remote state** - Enable versioning and encryption
3. **Restrict CORS origins** - Don't use `["*"]` in production
4. **Enable CloudTrail** - Monitor API activity
5. **Use least privilege IAM** - Already configured in modules

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Terraform Deploy

on:
  push:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: IaC

      - name: Terraform Plan
        run: terraform plan
        working-directory: IaC

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: IaC
```

## Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [AWS Lambda with Terraform](https://learn.hashicorp.com/tutorials/terraform/lambda-api-gateway)
