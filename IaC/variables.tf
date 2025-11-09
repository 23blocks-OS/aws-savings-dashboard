variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "aws-savings-dashboard"
}

variable "config_table_name" {
  description = "DynamoDB table name for Instance Scheduler configuration"
  type        = string
  default     = "InstanceScheduler-ConfigTable"
}

variable "schedule_tag_name" {
  description = "Tag name used to assign schedules to instances"
  type        = string
  default     = "Schedule"
}

variable "lambda_runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"
}

variable "enable_api_gateway_logging" {
  description = "Enable API Gateway access logging"
  type        = bool
  default     = true
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins for API"
  type        = list(string)
  default     = ["*"]
}
