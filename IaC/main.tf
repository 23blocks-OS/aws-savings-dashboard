# API Module
module "api" {
  source = "./modules/api"

  project_name       = var.project_name
  environment        = var.environment
  config_table_name  = var.config_table_name
  schedule_tag_name  = var.schedule_tag_name
  lambda_runtime     = var.lambda_runtime
  lambda_timeout     = var.lambda_timeout
  lambda_memory_size = var.lambda_memory_size
  api_stage_name     = var.api_stage_name
  cors_allowed_origins = var.cors_allowed_origins
  enable_logging     = var.enable_api_gateway_logging
}

# Dashboard Module
module "dashboard" {
  source = "./modules/dashboard"

  project_name          = var.project_name
  environment           = var.environment
  api_url               = module.api.api_url
  cloudfront_price_class = var.cloudfront_price_class
}
