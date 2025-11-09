variable "api_id" {
  description = "API Gateway ID"
  type        = string
}

variable "resource_id" {
  description = "API Gateway resource ID"
  type        = string
}

variable "allow_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}
