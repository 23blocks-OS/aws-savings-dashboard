output "api_url" {
  description = "API Gateway invoke URL"
  value       = "${aws_api_gateway_stage.api.invoke_url}/"
}

output "api_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.api.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api_function.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.api_function.arn
}
