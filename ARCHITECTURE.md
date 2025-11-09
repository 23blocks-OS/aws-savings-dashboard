# AWS Savings Dashboard - Architecture & Implementation Plan

## Overview

The AWS Savings Dashboard is a web-based UI tool for managing AWS Instance Scheduler configurations, providing an intuitive interface to replace manual DynamoDB table management and CLI commands.

## AWS Instance Scheduler Background

### How It Works
- **Purpose**: Automates starting/stopping of EC2 and RDS instances based on schedules
- **Architecture**: Hub-and-spoke model for cross-account, cross-region management
- **Storage**: DynamoDB table stores configuration with three item types:
  - `config` items: Global configuration settings
  - `schedule` items: Schedule definitions
  - `period` items: Time period definitions

### DynamoDB Schema

#### Schedule Items (type="schedule")
```json
{
  "type": "schedule",
  "name": "unique-schedule-name",
  "periods": ["period1", "period2"],
  "timezone": "US/Eastern",
  "override_status": "running|stopped",
  "enforced": true|false,
  "retain_running": true|false,
  "hibernate": true|false,
  "ssm-maintenance-window": "window-name",
  "description": "Schedule description"
}
```

#### Period Items (type="period")
```json
{
  "type": "period",
  "name": "unique-period-name",
  "begintime": "09:00",
  "endtime": "17:00",
  "weekdays": "Mon-Fri",
  "monthdays": "1-15",
  "months": "Jan-Jun",
  "description": "Period description"
}
```

#### Config Items (type="config")
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

## Solution Architecture

### Monorepo Structure
```
aws-savings-dashboard/
├── WebDashboard/          # React-based SPA
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── public/
│   └── package.json
├── Backend/               # Lambda functions and API
│   ├── src/
│   │   ├── handlers/      # Lambda function handlers
│   │   ├── services/      # Business logic
│   │   ├── repositories/  # DynamoDB data access
│   │   └── types/         # TypeScript types
│   └── package.json
├── IaC/                   # Infrastructure as Code
│   ├── lib/
│   │   ├── api-stack.ts   # API Gateway + Lambda
│   │   ├── dashboard-stack.ts  # S3 + CloudFront
│   │   └── pipeline-stack.ts   # CI/CD (optional)
│   └── bin/
│       └── app.ts
├── Docs/                  # Documentation
│   ├── user-guide.md
│   ├── api-reference.md
│   └── deployment.md
├── start.md
└── ARCHITECTURE.md
```

### Technology Stack

#### Frontend (WebDashboard)
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) or Ant Design
- **State Management**: React Query for server state, Zustand for client state
- **Routing**: React Router v6
- **Data Visualization**: Recharts or Chart.js for cost savings graphs
- **Form Handling**: React Hook Form
- **Date/Time**: date-fns or Day.js

#### Backend (API)
- **Runtime**: Node.js 20 (Lambda)
- **Framework**: AWS Lambda with API Gateway HTTP API
- **Language**: TypeScript
- **AWS SDK**: AWS SDK v3
- **Validation**: Zod for request validation
- **Testing**: Jest + AWS SDK mocks

#### Infrastructure (IaC)
- **Tool**: AWS CDK (TypeScript)
- **Hosting**: S3 + CloudFront for static site
- **API**: API Gateway HTTP API + Lambda functions
- **Security**: Cognito for authentication or IAM-based
- **Monitoring**: CloudWatch dashboards

### API Design

#### Endpoints

**Schedules**
- `GET /api/schedules` - List all schedules
- `GET /api/schedules/:name` - Get schedule details
- `POST /api/schedules` - Create new schedule
- `PUT /api/schedules/:name` - Update schedule
- `DELETE /api/schedules/:name` - Delete schedule

**Periods**
- `GET /api/periods` - List all periods
- `GET /api/periods/:name` - Get period details
- `POST /api/periods` - Create new period
- `PUT /api/periods/:name` - Update period
- `DELETE /api/periods/:name` - Delete period

**Configuration**
- `GET /api/config` - Get global configuration
- `PUT /api/config` - Update global configuration

**Instances**
- `GET /api/instances` - List managed instances (EC2 + RDS)
- `GET /api/instances/:id` - Get instance details
- `GET /api/instances/:id/schedule` - Get instance schedule forecast

**Analytics**
- `GET /api/analytics/savings` - Calculate cost savings
- `GET /api/analytics/coverage` - Get scheduling coverage statistics
- `GET /api/analytics/forecast` - Forecast upcoming start/stop events

### Frontend Features

#### 1. Dashboard (Home Page)
- **Overview Cards**:
  - Total managed instances (EC2 + RDS)
  - Active schedules count
  - Estimated monthly savings
  - Instances currently running vs stopped
- **Charts**:
  - Cost savings trend over time
  - Instance status distribution
  - Schedule coverage by account/region
- **Upcoming Events**: Next 24 hours of start/stop events

#### 2. Schedules Management
- **List View**: Table of all schedules with filters
- **Create/Edit Form**:
  - Schedule name
  - Period selection (multi-select)
  - Timezone picker
  - Advanced options (enforced, retain_running, hibernate, etc.)
  - Description
- **Schedule Preview**: Visual timeline showing when instances run
- **Validation**: Real-time validation with error messages

#### 3. Periods Management
- **List View**: Table of all periods
- **Create/Edit Form**:
  - Period name
  - Time range (begintime, endtime)
  - Day of week selector
  - Month selector
  - Day of month selector
  - Description
- **Visual Builder**: Interactive calendar/time picker
- **Period Preview**: Show which days/times are active

#### 4. Instances View
- **Filters**: By account, region, service type (EC2/RDS), schedule
- **Instance List**: Table showing:
  - Instance ID/name
  - Type (EC2/RDS)
  - Current status
  - Assigned schedule
  - Account/Region
  - Next action (start/stop) and time
  - Estimated monthly cost
  - Estimated savings
- **Bulk Actions**: Assign/unassign schedules to multiple instances
- **Instance Details**: Modal with full details and schedule forecast

#### 5. Analytics & Savings
- **Savings Calculator**:
  - Total savings (monthly, yearly)
  - Savings by account/region
  - Savings by instance type
  - ROI calculation
- **Reports**:
  - Schedule effectiveness
  - Instance utilization patterns
  - Compliance reports (enforced schedules)
- **Export**: CSV/PDF export of reports

#### 6. Configuration
- **Global Settings**:
  - Default timezone
  - Scheduled services (EC2, RDS)
  - Tag name for schedules
  - Regions to manage
  - Cross-account role ARN
- **Account Management**: List of managed accounts

### Data Flow

1. **User Action** → React Component
2. **Component** → API Service (React Query)
3. **API Gateway** → Lambda Function
4. **Lambda** → DynamoDB Repository Layer
5. **DynamoDB** → AWS Instance Scheduler Config Table
6. **Response** ← Back through the chain
7. **UI Update** ← React Query cache + component re-render

### Security Considerations

1. **Authentication**:
   - Option 1: Amazon Cognito User Pool
   - Option 2: IAM-based with temporary credentials

2. **Authorization**:
   - Role-based access control (Admin, Viewer)
   - Lambda authorizer for API Gateway

3. **API Security**:
   - CORS configuration
   - Request validation
   - Rate limiting

4. **DynamoDB Access**:
   - Least privilege IAM roles
   - Read-only mode for viewers
   - Audit logging with CloudTrail

### Cost Savings Calculation

#### Algorithm
```typescript
// For each instance:
1. Get instance type and region
2. Look up on-demand hourly rate
3. Calculate hours per month the instance is scheduled to run
4. Calculate hours saved = 730 - hours_running
5. Monthly savings = hours_saved * hourly_rate
6. Factor in: reserved instances, savings plans, spot instances
```

#### Data Sources
- AWS Pricing API for current rates
- CloudWatch metrics for actual usage
- Instance metadata for type/region

### Deployment Strategy

#### Development
1. Deploy API stack with Lambda functions
2. Set up local development environment for frontend
3. Use environment variables for API endpoint

#### Production
1. Deploy IaC stack (API + Dashboard)
2. CloudFront distribution points to S3 bucket
3. API Gateway custom domain
4. CI/CD pipeline for automatic deployments

### Future Enhancements

1. **Multi-tenant Support**: Separate dashboards per AWS account
2. **Notifications**: Email/Slack alerts for schedule changes
3. **Approval Workflow**: Require approval for schedule changes
4. **Schedule Templates**: Pre-built schedule templates
5. **AI Recommendations**: ML-based schedule optimization
6. **Mobile App**: React Native companion app
7. **Terraform Support**: Alternative to CDK for IaC

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Set up monorepo structure
- Create DynamoDB repository layer
- Build basic CRUD API for schedules and periods
- Deploy basic API Gateway + Lambda

### Phase 2: Basic UI (Week 2)
- React app scaffolding
- Schedule list and create/edit forms
- Period list and create/edit forms
- Basic navigation and routing

### Phase 3: Instance Management (Week 3)
- Instance discovery API
- Instance list view
- Schedule assignment interface
- Instance details and forecast

### Phase 4: Analytics & Savings (Week 4)
- Cost calculation engine
- Dashboard with charts
- Savings reports
- Export functionality

### Phase 5: Polish & Deploy (Week 5)
- Testing and bug fixes
- Documentation
- IaC for full deployment
- CI/CD pipeline

## Success Metrics

1. **Usability**: Reduce time to create/modify schedules by 80%
2. **Visibility**: 100% visibility into all managed instances
3. **Accuracy**: Cost savings calculations within 5% of actual
4. **Adoption**: Used by all teams managing scheduled instances
