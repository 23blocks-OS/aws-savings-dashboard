# API Reference

Complete reference for the AWS Savings Dashboard REST API.

## Base URL

```
https://<api-gateway-id>.execute-api.<region>.amazonaws.com/prod
```

## Authentication

Currently, the API does not require authentication. For production use, consider adding:
- API Keys
- AWS IAM authentication
- Amazon Cognito

## Common Headers

All requests should include:
```
Content-Type: application/json
```

## Response Format

### Success Response

```json
{
  "items": [...],
  "count": 10
}
```

### Error Response

```json
{
  "error": "Error name",
  "message": "Detailed error message",
  "details": {...}
}
```

## HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Delete successful
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., already exists)
- `500 Internal Server Error`: Server error

---

## Schedules

### List Schedules

Get all schedules.

**Endpoint**: `GET /schedules`

**Response**: `200 OK`
```json
{
  "items": [
    {
      "type": "schedule",
      "name": "dev-9to5",
      "periods": ["office-hours"],
      "timezone": "US/Eastern",
      "description": "Development environment schedule",
      "enforced": false,
      "retain_running": false,
      "hibernate": false
    }
  ],
  "count": 1
}
```

### Get Schedule

Get a single schedule by name.

**Endpoint**: `GET /schedules/{name}`

**Parameters**:
- `name` (path): Schedule name

**Response**: `200 OK`
```json
{
  "schedule": {
    "type": "schedule",
    "name": "dev-9to5",
    "periods": ["office-hours"],
    "timezone": "US/Eastern"
  },
  "instances": [
    {
      "id": "i-1234567890abcdef0",
      "name": "dev-server-1",
      "type": "t3.medium",
      "service": "ec2"
    }
  ],
  "instanceCount": 1
}
```

**Errors**:
- `404`: Schedule not found

### Create Schedule

Create a new schedule.

**Endpoint**: `POST /schedules`

**Request Body**:
```json
{
  "name": "dev-9to5",
  "periods": ["office-hours"],
  "timezone": "US/Eastern",
  "description": "Development environment schedule",
  "enforced": false,
  "retain_running": false,
  "hibernate": false
}
```

**Required Fields**:
- `name`: Schedule name (alphanumeric, hyphens, underscores)
- `periods`: Array of period names (at least one)

**Optional Fields**:
- `timezone`: Timezone (default: UTC)
- `description`: Description
- `enforced`: Prevent manual start/stop (default: false)
- `retain_running`: Keep running if manually started (default: false)
- `hibernate`: Use hibernation (default: false)
- `override_status`: Temporary override (`running` or `stopped`)
- `ssm_maintenance_window`: SSM maintenance window name

**Response**: `201 Created`
```json
{
  "type": "schedule",
  "name": "dev-9to5",
  "periods": ["office-hours"],
  "timezone": "US/Eastern"
}
```

**Errors**:
- `400`: Validation failed
- `409`: Schedule already exists

### Update Schedule

Update an existing schedule.

**Endpoint**: `PUT /schedules/{name}`

**Parameters**:
- `name` (path): Schedule name

**Request Body**: Same as Create, all fields optional
```json
{
  "description": "Updated description",
  "periods": ["office-hours", "extended-hours"]
}
```

**Response**: `200 OK`
```json
{
  "type": "schedule",
  "name": "dev-9to5",
  "periods": ["office-hours", "extended-hours"],
  "description": "Updated description"
}
```

**Errors**:
- `404`: Schedule not found
- `400`: Validation failed

### Delete Schedule

Delete a schedule.

**Endpoint**: `DELETE /schedules/{name}`

**Parameters**:
- `name` (path): Schedule name

**Response**: `204 No Content`

**Errors**:
- `404`: Schedule not found
- `409`: Schedule is assigned to instances

### Get Schedule Forecast

Get upcoming start/stop events for a schedule.

**Endpoint**: `GET /schedules/{name}/forecast`

**Parameters**:
- `name` (path): Schedule name
- `days` (query): Number of days ahead (default: 7)
- `instanceId` (query): Instance ID (default: "preview")

**Response**: `200 OK`
```json
{
  "instanceId": "preview",
  "schedule": "dev-9to5",
  "timezone": "US/Eastern",
  "nextEvents": [
    {
      "action": "start",
      "timestamp": "2024-01-15T09:00:00Z",
      "periodName": "office-hours"
    },
    {
      "action": "stop",
      "timestamp": "2024-01-15T17:00:00Z",
      "periodName": "office-hours"
    }
  ]
}
```

---

## Periods

### List Periods

Get all periods.

**Endpoint**: `GET /periods`

**Response**: `200 OK`
```json
{
  "items": [
    {
      "type": "period",
      "name": "office-hours",
      "begintime": "09:00",
      "endtime": "17:00",
      "weekdays": "Mon-Fri",
      "description": "Standard office hours"
    }
  ],
  "count": 1
}
```

### Get Period

Get a single period by name.

**Endpoint**: `GET /periods/{name}`

**Parameters**:
- `name` (path): Period name

**Response**: `200 OK`
```json
{
  "type": "period",
  "name": "office-hours",
  "begintime": "09:00",
  "endtime": "17:00",
  "weekdays": "Mon-Fri"
}
```

### Create Period

Create a new period.

**Endpoint**: `POST /periods`

**Request Body**:
```json
{
  "name": "office-hours",
  "begintime": "09:00",
  "endtime": "17:00",
  "weekdays": "Mon-Fri",
  "description": "Standard office hours"
}
```

**Required Fields**:
- `name`: Period name
- At least one of: `begintime`, `endtime`, `weekdays`, `monthdays`, `months`

**Optional Fields**:
- `begintime`: Start time (HH:MM format)
- `endtime`: End time (HH:MM format)
- `weekdays`: Days of week (e.g., "Mon-Fri", "Mon,Wed,Fri")
- `monthdays`: Days of month (e.g., "1-15", "1,15,30")
- `months`: Months (e.g., "Jan-Jun", "Jan,Apr,Jul,Oct")
- `description`: Description

**Response**: `201 Created`

**Errors**:
- `400`: Validation failed
- `409`: Period already exists

### Update Period

Update an existing period.

**Endpoint**: `PUT /periods/{name}`

**Request Body**: Same as Create, all fields optional

**Response**: `200 OK`

**Errors**:
- `404`: Period not found
- `400`: Validation failed

### Delete Period

Delete a period.

**Endpoint**: `DELETE /periods/{name}`

**Response**: `204 No Content`

**Errors**:
- `404`: Period not found
- `409`: Period is used by schedules

---

## Configuration

### Get Configuration

Get global configuration.

**Endpoint**: `GET /config`

**Response**: `200 OK`
```json
{
  "type": "config",
  "name": "scheduler-config",
  "scheduled_services": ["ec2", "rds"],
  "tagname": "Schedule",
  "default_timezone": "UTC",
  "regions": ["us-east-1", "us-west-2"]
}
```

### Update Configuration

Update global configuration.

**Endpoint**: `PUT /config`

**Request Body**:
```json
{
  "scheduled_services": ["ec2", "rds"],
  "tagname": "Schedule",
  "default_timezone": "UTC",
  "regions": ["us-east-1", "us-west-2", "eu-west-1"]
}
```

**All fields are optional**

**Response**: `200 OK`

---

## Instances

### List Instances

Get all EC2 and RDS instances.

**Endpoint**: `GET /instances`

**Query Parameters**:
- `service`: Filter by service (`ec2` or `rds`)
- `region`: Filter by region
- `schedule`: Filter by schedule name
- `state`: Filter by state (`running`, `stopped`, etc.)

**Example**: `GET /instances?service=ec2&state=running`

**Response**: `200 OK`
```json
{
  "items": [
    {
      "id": "i-1234567890abcdef0",
      "name": "dev-server-1",
      "type": "t3.medium",
      "service": "ec2",
      "state": "running",
      "schedule": "dev-9to5",
      "account": "123456789012",
      "region": "us-east-1",
      "instanceType": "t3.medium",
      "tags": {
        "Name": "dev-server-1",
        "Schedule": "dev-9to5"
      }
    }
  ],
  "count": 1
}
```

### Get Instance

Get a single instance.

**Endpoint**: `GET /instances/{id}`

**Parameters**:
- `id` (path): Instance ID

**Response**: `200 OK`

**Errors**:
- `404`: Instance not found

---

## Analytics

### Get Dashboard Stats

Get dashboard statistics.

**Endpoint**: `GET /analytics/dashboard`

**Response**: `200 OK`
```json
{
  "totalInstances": 100,
  "runningInstances": 45,
  "stoppedInstances": 55,
  "scheduledInstances": 80,
  "activeSchedules": 5,
  "activePeriods": 10,
  "estimatedMonthlySavings": 2500.00,
  "upcomingEvents": [
    {
      "action": "start",
      "timestamp": "2024-01-15T09:00:00Z",
      "periodName": "office-hours"
    }
  ]
}
```

### Get Savings Summary

Get total savings analysis.

**Endpoint**: `GET /analytics/savings`

**Response**: `200 OK`
```json
{
  "totalInstances": 100,
  "managedInstances": 80,
  "activeSchedules": 5,
  "totalMonthlySavings": 2500.00,
  "totalYearlySavings": 30000.00,
  "savingsByAccount": {
    "123456789012": 2500.00
  },
  "savingsByRegion": {
    "us-east-1": 1500.00,
    "us-west-2": 1000.00
  },
  "savingsByService": {
    "ec2": 2000.00,
    "rds": 500.00
  }
}
```

### Get Schedule Savings

Get savings for a specific schedule.

**Endpoint**: `GET /analytics/schedules/{name}/savings`

**Parameters**:
- `name` (path): Schedule name

**Response**: `200 OK`
```json
{
  "schedule": "dev-9to5",
  "instanceCount": 10,
  "totalMonthlySavings": 500.00,
  "totalYearlySavings": 6000.00,
  "instances": [
    {
      "instanceId": "i-1234567890abcdef0",
      "instanceType": "t3.medium",
      "region": "us-east-1",
      "service": "ec2",
      "hoursPerMonth": 173,
      "hoursSaved": 557,
      "hourlyRate": 0.0416,
      "monthlyCost": 7.20,
      "monthlySavings": 23.17,
      "yearlySavings": 278.04
    }
  ]
}
```

### Get Instance Savings

Get savings for a specific instance.

**Endpoint**: `GET /analytics/instances/{id}/savings`

**Parameters**:
- `id` (path): Instance ID

**Response**: `200 OK`
```json
{
  "instanceId": "i-1234567890abcdef0",
  "instanceType": "t3.medium",
  "region": "us-east-1",
  "service": "ec2",
  "hoursPerMonth": 173,
  "hoursSaved": 557,
  "hourlyRate": 0.0416,
  "monthlyCost": 7.20,
  "monthlySavings": 23.17,
  "yearlySavings": 278.04
}
```

---

## Error Handling

### Example Error Responses

**Validation Error**:
```json
{
  "error": "Validation failed",
  "message": "Invalid request data",
  "details": [
    {
      "field": "name",
      "message": "Schedule name can only contain letters, numbers, hyphens, and underscores"
    }
  ]
}
```

**Not Found**:
```json
{
  "error": "Not found",
  "message": "Schedule 'dev-9to5' not found"
}
```

**Conflict**:
```json
{
  "error": "Conflict",
  "message": "Schedule 'dev-9to5' already exists"
}
```

## Rate Limiting

Currently, no rate limiting is enforced. For production use, consider:
- API Gateway throttling settings
- Lambda concurrency limits
- Usage plans with API keys

## Pagination

Currently, all list endpoints return all items. For large datasets, consider implementing pagination using:
- `limit`: Number of items per page
- `offset`: Starting position
- `nextToken`: Token for next page
