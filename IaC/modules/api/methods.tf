# Schedules endpoints
resource "aws_api_gateway_method" "schedules_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.schedules.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "schedules_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.schedules.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "schedule_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.schedule_name.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "schedule_put" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.schedule_name.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "schedule_delete" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.schedule_name.id
  http_method   = "DELETE"
  authorization = "NONE"
}

# Periods endpoints
resource "aws_api_gateway_method" "periods_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.periods.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "periods_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.periods.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "period_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.period_name.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "period_put" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.period_name.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "period_delete" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.period_name.id
  http_method   = "DELETE"
  authorization = "NONE"
}

# Config endpoints
resource "aws_api_gateway_method" "config_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.config.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "config_put" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.config.id
  http_method   = "PUT"
  authorization = "NONE"
}

# Instances endpoints
resource "aws_api_gateway_method" "instances_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.instances.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "instance_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.instance_id.id
  http_method   = "GET"
  authorization = "NONE"
}

# Analytics endpoints
resource "aws_api_gateway_method" "analytics_dashboard_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.analytics_dashboard.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "analytics_savings_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.analytics_savings.id
  http_method   = "GET"
  authorization = "NONE"
}
