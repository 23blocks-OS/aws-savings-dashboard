# Deployment Guide

This guide will walk you through deploying the AWS Savings Dashboard to your AWS account using Terraform.

## Prerequisites

Before deploying, ensure you have:

1. **AWS Instance Scheduler deployed** in your AWS account
   - Follow the [AWS Instance Scheduler deployment guide](https://docs.aws.amazon.com/solutions/latest/instance-scheduler-on-aws/deployment.html)
   - Note the DynamoDB configuration table name (default: `InstanceScheduler-ConfigTable`)

2. **AWS CLI configured** with appropriate credentials
   ```bash
   aws configure
   ```

3. **Node.js 18+** and npm installed
   ```bash
   node --version  # Should be 18.x or higher
   npm --version
   ```

4. **Terraform** installed (version >= 1.5)
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/

   # Verify installation
   terraform --version
   ```

5. **Git** installed for cloning the repository

## Deployment Steps

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd aws-savings-dashboard

# Install Backend dependencies
cd Backend
npm install
cd ..

# Install WebDashboard dependencies
cd WebDashboard
npm install
cd ..
```

### Step 2: Configure Environment Variables

#### Backend Configuration

```bash
cd Backend
cp .env.example .env
# Edit .env with your values
```

Edit `Backend/.env`:
```env
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
CONFIG_TABLE_NAME=InstanceScheduler-ConfigTable
SCHEDULE_TAG_NAME=Schedule
NODE_ENV=production
```

### Step 3: Build the Backend

```bash
cd Backend
npm run build
cd ..
```

This will compile TypeScript to JavaScript in the `Backend/dist` folder, which Terraform will package into a Lambda deployment.

### Step 4: Configure Terraform

```bash
cd IaC

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vi terraform.tfvars
```

Edit `IaC/terraform.tfvars`:
```hcl
aws_region         = "us-east-1"
environment        = "prod"
project_name       = "aws-savings-dashboard"
config_table_name  = "InstanceScheduler-ConfigTable"  # Your Instance Scheduler table
schedule_tag_name  = "Schedule"

# Lambda Configuration
lambda_runtime     = "nodejs20.x"
lambda_timeout     = 30
lambda_memory_size = 512

# API Gateway
api_stage_name     = "prod"
enable_api_gateway_logging = true

# CORS - restrict in production!
cors_allowed_origins = ["*"]

# CloudFront
cloudfront_price_class = "PriceClass_100"
```

### Step 5: Initialize Terraform

```bash
# Initialize Terraform (downloads providers and modules)
terraform init
```

### Step 6: Review the Plan

```bash
# See what Terraform will create
terraform plan
```

Review the output to ensure it's creating the expected resources.

### Step 7: Deploy Infrastructure

```bash
# Apply the Terraform configuration
terraform apply
```

Type `yes` when prompted. This will create:
- Lambda function for the API
- API Gateway with all endpoints
- IAM roles and policies
- S3 bucket for hosting
- CloudFront distribution
- CloudWatch log groups

**Note**: CloudFront distribution can take 15-30 minutes to deploy.

### Step 8: Get the API URL

After deployment completes, get the API URL:

```bash
terraform output api_url
```

Copy this URL - you'll need it for the frontend configuration.

### Step 9: Configure and Build the Frontend

```bash
cd ../WebDashboard

# Create .env file
cp .env.example .env
```

Edit `WebDashboard/.env` and add the API URL from Step 8:
```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

Build the frontend:
```bash
npm run build
```

This creates an optimized production build in `WebDashboard/dist`.

### Step 10: Upload Frontend to S3

```bash
# Get the S3 bucket name from Terraform
cd ../IaC
BUCKET_NAME=$(terraform output -raw s3_bucket_name)

# Upload the built files
cd ../WebDashboard
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# Get CloudFront distribution ID
cd ../IaC
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)

# Invalidate CloudFront cache to serve new files
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Step 11: Access Your Dashboard

Get the dashboard URL:

```bash
cd IaC
terraform output dashboard_url
```

Open this URL in your browser. You should see the AWS Savings Dashboard!

## Configuration Options

### Custom DynamoDB Table Name

If your Instance Scheduler uses a different table name, update `terraform.tfvars`:

```hcl
config_table_name = "YourCustomTableName"
```

### Custom Schedule Tag

If your Instance Scheduler uses a different tag name:

```hcl
schedule_tag_name = "YourCustomTag"
```

### Deploy to Different Region

Update `terraform.tfvars`:

```hcl
aws_region = "eu-west-1"
```

### Multiple Environments

Use Terraform workspaces:

```bash
# Create dev workspace
terraform workspace new dev

# Deploy dev environment
terraform apply -var="environment=dev"

# Switch back to prod
terraform workspace select default
```

## Updating the Deployment

### Update Backend Code

```bash
# Make your changes to Backend code
cd Backend
npm run build
cd ../IaC

# Force Lambda update
terraform taint module.api.aws_lambda_function.api_function
terraform apply
```

### Update Frontend

```bash
# Make your changes to WebDashboard code
cd WebDashboard
npm run build

# Upload to S3
BUCKET_NAME=$(cd ../IaC && terraform output -raw s3_bucket_name)
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(cd ../IaC && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

### Update Infrastructure

```bash
# Make changes to Terraform files
cd IaC

# Review changes
terraform plan

# Apply changes
terraform apply
```

## Remote State Configuration

For team collaboration, configure remote state storage in `IaC/backend.tf`:

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
# Create S3 bucket
aws s3 mb s3://your-terraform-state-bucket --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Migrate state
cd IaC
terraform init -migrate-state
```

## Troubleshooting

### Terraform Can't Find Backend Files

**Error**: `Error creating lambda.zip: no such file or directory`

**Solution**: Build the backend first:
```bash
cd Backend && npm run build && cd ../IaC
```

### Lambda Function Can't Access DynamoDB

**Error**: `User is not authorized to perform: dynamodb:GetItem`

**Solution**: Verify the DynamoDB table name in `terraform.tfvars` matches your Instance Scheduler table.

### API Returns CORS Errors

**Error**: CORS policy blocks requests from frontend

**Solution**:
1. Check `cors_allowed_origins` in `terraform.tfvars`
2. For production, set to your CloudFront domain:
   ```hcl
   cors_allowed_origins = ["https://dxxxxxxxxxxxxx.cloudfront.net"]
   ```
3. Reapply Terraform: `terraform apply`

### S3 Bucket Name Conflict

**Error**: `BucketAlreadyExists` or `BucketAlreadyOwnedByYou`

**Solution**: Bucket names must be globally unique. Change `project_name` in `terraform.tfvars`:
```hcl
project_name = "aws-savings-dashboard-mycompany"
```

### CloudFront Takes Too Long

CloudFront distributions can take 15-30 minutes to create or update. This is normal AWS behavior. You can check status:

```bash
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'
```

### Terraform State Lock

**Error**: `Error acquiring the state lock`

**Solution**:
```bash
# If using remote state with DynamoDB locking
# Force unlock (use with caution!)
terraform force-unlock <LOCK_ID>
```

## Cost Estimation

Use Infracost to estimate costs:

```bash
# Install Infracost
brew install infracost  # macOS

# Generate cost estimate
cd IaC
infracost breakdown --path .
```

Expected monthly costs:

- **Lambda**: ~$2-5/month (depends on usage)
- **API Gateway**: ~$3-5/month (for typical usage)
- **S3**: ~$1/month (for static hosting)
- **CloudFront**: ~$1/month (for CDN)
- **CloudWatch Logs**: ~$1/month
- **Total**: ~$8-17/month

This is minimal compared to the savings from Instance Scheduler (typically $1000s/month).

## Security Best Practices

1. **Restrict CORS origins** in production:
   ```hcl
   cors_allowed_origins = ["https://your-cloudfront-domain.cloudfront.net"]
   ```

2. **Enable CloudTrail** for audit logging

3. **Use remote state** with encryption and locking

4. **Never commit** `terraform.tfvars` to git (already in `.gitignore`)

5. **Enable API Gateway authentication** (add Cognito or API keys)

6. **Review IAM policies** - use least privilege (already configured)

## Cleanup

To remove all resources:

```bash
cd IaC
terraform destroy
```

Type `yes` when prompted.

**Note**: This will delete:
- Lambda functions
- API Gateway
- S3 bucket and all contents
- CloudFront distribution
- IAM roles
- CloudWatch log groups

This does **NOT** delete your Instance Scheduler or its DynamoDB table.

## Next Steps

After deployment:

1. Access the dashboard at the CloudFront URL
2. Configure settings (tag name, regions)
3. Create your first period and schedule
4. Tag instances with schedules
5. Monitor savings in the Analytics page

For usage instructions, see the [User Guide](./user-guide.md).
