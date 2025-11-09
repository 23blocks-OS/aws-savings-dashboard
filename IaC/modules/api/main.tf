# Data source for current AWS account
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Lambda package - assumes Backend code is built in ../../../Backend/dist
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../Backend/dist"
  output_path = "${path.module}/lambda.zip"
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# DynamoDB access policy
resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "${var.project_name}-${var.environment}-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ]
      Resource = [
        "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.config_table_name}"
      ]
    }]
  })
}

# EC2 and RDS read access policy
resource "aws_iam_role_policy" "ec2_rds_policy" {
  name = "${var.project_name}-${var.environment}-ec2-rds-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ]
      Resource = "*"
    }]
  })
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api_function.function_name}"
  retention_in_days = 7
}

# Lambda Function
resource "aws_lambda_function" "api_function" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      CONFIG_TABLE_NAME = var.config_table_name
      SCHEDULE_TAG_NAME = var.schedule_tag_name
      NODE_ENV          = var.environment
    }
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "API for AWS Savings Dashboard"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway Resources and Methods
# Root level resources
resource "aws_api_gateway_resource" "schedules" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "schedules"
}

resource "aws_api_gateway_resource" "periods" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "periods"
}

resource "aws_api_gateway_resource" "config" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "config"
}

resource "aws_api_gateway_resource" "instances" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "instances"
}

resource "aws_api_gateway_resource" "analytics" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "analytics"
}

# Nested resources
resource "aws_api_gateway_resource" "schedule_name" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.schedules.id
  path_part   = "{name}"
}

resource "aws_api_gateway_resource" "period_name" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.periods.id
  path_part   = "{name}"
}

resource "aws_api_gateway_resource" "instance_id" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.instances.id
  path_part   = "{id}"
}

# Analytics resources
resource "aws_api_gateway_resource" "analytics_dashboard" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.analytics.id
  path_part   = "dashboard"
}

resource "aws_api_gateway_resource" "analytics_savings" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.analytics.id
  path_part   = "savings"
}

# Lambda Integration
resource "aws_api_gateway_integration" "lambda" {
  for_each = toset([
    aws_api_gateway_method.schedules_get.id,
    aws_api_gateway_method.schedules_post.id,
    aws_api_gateway_method.schedule_get.id,
    aws_api_gateway_method.schedule_put.id,
    aws_api_gateway_method.schedule_delete.id,
    aws_api_gateway_method.periods_get.id,
    aws_api_gateway_method.periods_post.id,
    aws_api_gateway_method.period_get.id,
    aws_api_gateway_method.period_put.id,
    aws_api_gateway_method.period_delete.id,
    aws_api_gateway_method.config_get.id,
    aws_api_gateway_method.config_put.id,
    aws_api_gateway_method.instances_get.id,
    aws_api_gateway_method.instance_get.id,
    aws_api_gateway_method.analytics_dashboard_get.id,
    aws_api_gateway_method.analytics_savings_get.id,
  ])

  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = split(".", each.key)[0]
  http_method = split(".", each.key)[1]

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_function.invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "api" {
  depends_on = [
    aws_api_gateway_integration.lambda
  ]

  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.api.body,
      aws_lambda_function.api_function.source_code_hash,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "api" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.api_stage_name

  access_log_settings {
    destination_arn = var.enable_logging ? aws_cloudwatch_log_group.api_logs[0].arn : null
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  count             = var.enable_logging ? 1 : 0
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 7
}

# CORS Configuration
module "cors" {
  source  = "./cors"

  for_each = {
    schedules = aws_api_gateway_resource.schedules.id
    schedule_name = aws_api_gateway_resource.schedule_name.id
    periods = aws_api_gateway_resource.periods.id
    period_name = aws_api_gateway_resource.period_name.id
    config = aws_api_gateway_resource.config.id
    instances = aws_api_gateway_resource.instances.id
    instance_id = aws_api_gateway_resource.instance_id.id
    analytics_dashboard = aws_api_gateway_resource.analytics_dashboard.id
    analytics_savings = aws_api_gateway_resource.analytics_savings.id
  }

  api_id      = aws_api_gateway_rest_api.api.id
  resource_id = each.value
  allow_origins = var.cors_allowed_origins
}
