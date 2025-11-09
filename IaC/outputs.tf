output "api_url" {
  description = "API Gateway invoke URL"
  value       = module.api.api_url
}

output "api_id" {
  description = "API Gateway ID"
  value       = module.api.api_id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.api.lambda_function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.api.lambda_function_arn
}

output "dashboard_url" {
  description = "CloudFront distribution URL"
  value       = module.dashboard.cloudfront_url
}

output "dashboard_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.dashboard.cloudfront_domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for dashboard"
  value       = module.dashboard.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.dashboard.cloudfront_distribution_id
}
