variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "config_table_name" {
  description = "DynamoDB config table name"
  type        = string
}

variable "schedule_tag_name" {
  description = "Tag name for schedules"
  type        = string
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
}

variable "enable_logging" {
  description = "Enable API Gateway logging"
  type        = bool
}
