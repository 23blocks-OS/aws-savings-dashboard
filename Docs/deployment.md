# Deployment Guide

This guide will walk you through deploying the AWS Savings Dashboard to your AWS account.

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

4. **AWS CDK** installed globally
   ```bash
   npm install -g aws-cdk
   cdk --version
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

# Install IaC dependencies
cd IaC
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

#### WebDashboard Configuration

The API URL will be automatically configured after deploying the API stack.

### Step 3: Build the Backend

```bash
cd Backend
npm run build
cd ..
```

This will compile TypeScript to JavaScript in the `Backend/dist` folder.

### Step 4: Bootstrap CDK (First-time only)

If this is your first time using CDK in this AWS account and region:

```bash
cd IaC
cdk bootstrap aws://ACCOUNT-ID/REGION
```

Replace `ACCOUNT-ID` and `REGION` with your values.

### Step 5: Deploy the API Stack

```bash
cd IaC

# Review what will be created
cdk diff AwsSavingsDashboardApiStack

# Deploy the API stack
cdk deploy AwsSavingsDashboardApiStack
```

After deployment, note the API Gateway URL from the output:
```
Outputs:
AwsSavingsDashboardApiStack.ApiUrl = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

### Step 6: Configure and Build the Frontend

```bash
cd ../WebDashboard

# Create .env file
cp .env.example .env
```

Edit `WebDashboard/.env` and add the API URL from the previous step:
```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

Build the frontend:
```bash
npm run build
```

This creates an optimized production build in `WebDashboard/dist`.

### Step 7: Deploy the Dashboard Stack

```bash
cd ../IaC

# Review what will be created
cdk diff AwsSavingsDashboardStack

# Deploy the dashboard stack
cdk deploy AwsSavingsDashboardStack
```

After deployment, note the CloudFront URL from the output:
```
Outputs:
AwsSavingsDashboardStack.DistributionUrl = https://xxxxxxxxxxxxxx.cloudfront.net
```

### Step 8: Access Your Dashboard

Open the CloudFront URL in your browser. You should see the AWS Savings Dashboard!

## Configuration Options

### Custom DynamoDB Table Name

If your Instance Scheduler uses a different table name:

```bash
cdk deploy AwsSavingsDashboardApiStack \
  --context configTableName=YourTableName
```

### Custom Schedule Tag

If your Instance Scheduler uses a different tag name:

```bash
cdk deploy AwsSavingsDashboardApiStack \
  --context scheduleTagName=YourTagName
```

### Deploy to Different Region

```bash
export CDK_DEFAULT_REGION=eu-west-1
cdk deploy --all
```

## Updating the Deployment

### Update Backend

```bash
cd Backend
npm run build
cd ../IaC
cdk deploy AwsSavingsDashboardApiStack
```

### Update Frontend

```bash
cd WebDashboard
npm run build
cd ../IaC
cdk deploy AwsSavingsDashboardStack
```

## Troubleshooting

### Lambda Function Can't Access DynamoDB

**Error**: `User is not authorized to perform: dynamodb:GetItem`

**Solution**: Verify the DynamoDB table name matches your Instance Scheduler configuration table.

### CloudFront Shows 404

**Error**: Accessing the CloudFront URL returns 404

**Solution**:
1. Verify the frontend was built: `ls WebDashboard/dist`
2. Redeploy: `cdk deploy AwsSavingsDashboardStack`

### API Returns CORS Errors

**Error**: CORS policy blocks requests from frontend

**Solution**: The API is configured with `allowOrigins: ALL_ORIGINS`. If this doesn't work:
1. Check browser console for exact error
2. Verify the API URL is correct in `.env`

### Lambda Timeout

**Error**: Lambda function times out (>30s)

**Solution**: This may happen if you have many instances. Increase timeout in `IaC/lib/api-stack.ts`:
```typescript
timeout: cdk.Duration.seconds(60),
```

## Cost Estimation

Running this dashboard costs approximately:

- **Lambda**: ~$2-5/month (depends on usage)
- **API Gateway**: ~$3-5/month (for typical usage)
- **S3**: ~$1/month (for static hosting)
- **CloudFront**: ~$1/month (for CDN)
- **Total**: ~$7-15/month

This is minimal compared to the savings from Instance Scheduler (often $1000s/month).

## Security Best Practices

1. **Enable CloudFront HTTPS only** (already configured)
2. **Add authentication** using Amazon Cognito
3. **Restrict API access** using API keys or IAM
4. **Enable CloudTrail** for audit logging
5. **Use VPC endpoints** for Lambda to DynamoDB access
6. **Implement least-privilege IAM roles**

## Cleanup

To remove all resources:

```bash
cd IaC
cdk destroy --all
```

This will delete:
- Lambda functions
- API Gateway
- S3 bucket and contents
- CloudFront distribution
- IAM roles

**Note**: This does NOT delete your Instance Scheduler or its DynamoDB table.
