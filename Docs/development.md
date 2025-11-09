# Development Guide

Guide for developers contributing to or customizing the AWS Savings Dashboard.

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured
- Git
- Code editor (VS Code recommended)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd aws-savings-dashboard

# Install all dependencies
cd Backend && npm install && cd ..
cd WebDashboard && npm install && cd ..
cd IaC && npm install && cd ..
```

### Running Locally

#### Backend Development

The backend requires access to AWS resources (DynamoDB, EC2, RDS).

**Option 1: Use AWS SAM Local**

```bash
cd Backend

# Build
npm run build

# Start local API
sam local start-api
```

**Option 2: Deploy to AWS and test**

```bash
cd IaC
cdk deploy AwsSavingsDashboardApiStack
```

#### Frontend Development

```bash
cd WebDashboard

# Start dev server
npm run dev

# Or build for production
npm run build
```

The dev server runs on `http://localhost:3000` with hot reload.

## Project Structure

### Backend

```
Backend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── schedules.ts   # Schedule CRUD operations
│   │   ├── periods.ts     # Period CRUD operations
│   │   ├── config.ts      # Configuration management
│   │   ├── instances.ts   # Instance listing
│   │   └── analytics.ts   # Analytics and savings
│   ├── services/          # Business logic layer
│   │   ├── schedule-service.ts
│   │   └── analytics-service.ts
│   ├── repositories/      # Data access layer
│   │   ├── dynamodb-repository.ts
│   │   └── instance-repository.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   └── utils/             # Utility functions
│       └── api-utils.ts
├── tests/                 # Unit and integration tests
├── package.json
└── tsconfig.json
```

### WebDashboard

```
WebDashboard/
├── src/
│   ├── components/        # Reusable React components
│   │   └── Layout.tsx
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Schedules.tsx
│   │   ├── Periods.tsx
│   │   ├── Instances.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── services/          # API client
│   │   └── api.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── App.tsx            # Root component
│   └── main.tsx           # Entry point
├── public/
├── index.html
└── vite.config.ts
```

### IaC

```
IaC/
├── bin/
│   └── app.ts             # CDK app entry point
├── lib/
│   ├── api-stack.ts       # API Gateway + Lambda stack
│   └── dashboard-stack.ts # S3 + CloudFront stack
└── cdk.json
```

## Adding New Features

### Adding a New API Endpoint

#### 1. Define Types

**Backend/src/types/index.ts**:
```typescript
export interface MyNewFeature {
  id: string;
  name: string;
  // ...
}
```

#### 2. Create Repository Method

**Backend/src/repositories/dynamodb-repository.ts**:
```typescript
async getMyNewFeature(id: string): Promise<MyNewFeature | null> {
  const command = new GetCommand({
    TableName: this.tableName,
    Key: { type: 'my-feature', id },
  });
  const response = await this.docClient.send(command);
  return response.Item as MyNewFeature || null;
}
```

#### 3. Create Handler

**Backend/src/handlers/my-feature.ts**:
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBRepository } from '../repositories/dynamodb-repository';
import { createResponse, handleError } from '../utils/api-utils';

const dbRepo = new DynamoDBRepository();

export async function getMyFeature(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createResponse(400, { error: 'ID is required' });
    }

    const feature = await dbRepo.getMyNewFeature(id);
    if (!feature) {
      return createResponse(404, { error: 'Not found' });
    }

    return createResponse(200, feature);
  } catch (error) {
    return handleError(error);
  }
}
```

#### 4. Add to API Stack

**IaC/lib/api-stack.ts**:
```typescript
const myFeature = this.api.root.addResource('my-feature');
const myFeatureItem = myFeature.addResource('{id}');
myFeatureItem.addMethod('GET', lambdaIntegration);
```

#### 5. Update Frontend API Client

**WebDashboard/src/services/api.ts**:
```typescript
export const myFeatureApi = {
  get: (id: string) => api.get<MyNewFeature>(`/my-feature/${id}`),
};
```

#### 6. Create Page Component

**WebDashboard/src/pages/MyFeature.tsx**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { myFeatureApi } from '../services/api';

export default function MyFeature() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-feature', id],
    queryFn: () => myFeatureApi.get(id).then(res => res.data),
  });

  // Render component
}
```

### Adding a New Page

1. Create page component in `WebDashboard/src/pages/`
2. Add route in `WebDashboard/src/App.tsx`
3. Add menu item in `WebDashboard/src/components/Layout.tsx`

## Testing

### Backend Unit Tests

```bash
cd Backend
npm test
```

**Example test** (`Backend/tests/schedule-service.test.ts`):
```typescript
import { DynamoDBRepository } from '../src/repositories/dynamodb-repository';
import { ScheduleService } from '../src/services/schedule-service';

jest.mock('../src/repositories/dynamodb-repository');

describe('ScheduleService', () => {
  it('should validate schedule', async () => {
    const mockRepo = new DynamoDBRepository() as jest.Mocked<DynamoDBRepository>;
    mockRepo.validatePeriods.mockResolvedValue();

    const service = new ScheduleService(mockRepo, {} as any);
    const schedule = {
      type: 'schedule' as const,
      name: 'test',
      periods: ['period1'],
    };

    await expect(service.validateSchedule(schedule)).resolves.not.toThrow();
  });
});
```

### Frontend Testing

```bash
cd WebDashboard
npm test
```

### Integration Testing

Use AWS SAM Local or deploy to a test stack:

```bash
# Deploy to test stack
cd IaC
cdk deploy --context environment=test
```

## Code Style

### TypeScript

- Use strict TypeScript mode
- Define interfaces for all data structures
- Use async/await over promises
- Handle errors explicitly

### React

- Use functional components with hooks
- Use TypeScript for props
- Keep components small and focused
- Use React Query for server state

### Naming Conventions

- **Files**: kebab-case (`schedule-service.ts`)
- **Components**: PascalCase (`ScheduleList.tsx`)
- **Functions**: camelCase (`getSchedule()`)
- **Types/Interfaces**: PascalCase (`Schedule`, `Period`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEZONE`)

## Git Workflow

### Branch Naming

- Feature: `feature/add-notifications`
- Bug fix: `fix/schedule-timezone-bug`
- Docs: `docs/update-deployment-guide`

### Commit Messages

```
feat: add email notifications for schedule changes
fix: correct timezone handling in period calculations
docs: update API reference with new endpoints
refactor: simplify schedule validation logic
test: add unit tests for analytics service
```

### Pull Request Process

1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Submit PR with description
5. Address review comments
6. Merge after approval

## Debugging

### Backend Debugging

**CloudWatch Logs**:
```bash
# View logs
aws logs tail /aws/lambda/AwsSavingsDashboardApiStack-ApiFunction --follow
```

**Local debugging**:
```typescript
// Add console.log statements
console.log('Schedule data:', schedule);
```

### Frontend Debugging

**React DevTools**: Install browser extension

**Network tab**: Check API requests/responses

**Console logging**:
```typescript
console.log('API response:', data);
```

## Performance Optimization

### Backend

- Use DynamoDB batch operations for multiple items
- Implement caching with API Gateway
- Optimize Lambda memory allocation
- Use Lambda layers for shared code

### Frontend

- Use React Query caching
- Implement pagination for large lists
- Lazy load routes with `React.lazy()`
- Optimize bundle size with code splitting

## Security Best Practices

### Backend

- Validate all input with Zod schemas
- Use least privilege IAM roles
- Sanitize error messages (no stack traces in production)
- Enable CloudTrail logging

### Frontend

- Sanitize user input
- Use HTTPS only
- Implement CSP headers
- Don't expose sensitive data in client

## Monitoring

### CloudWatch Dashboards

Create custom dashboard:
```typescript
// Add to IaC/lib/monitoring-stack.ts
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
  dashboardName: 'AwsSavingsDashboard',
});

dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'API Requests',
    left: [apiFunction.metricInvocations()],
  })
);
```

### Alarms

```typescript
apiFunction.metricErrors().createAlarm(this, 'ApiErrors', {
  threshold: 10,
  evaluationPeriods: 1,
});
```

## Troubleshooting

### Common Issues

**TypeScript compilation errors**:
```bash
# Clean and rebuild
rm -rf dist
npm run build
```

**CDK deployment fails**:
```bash
# Bootstrap CDK
cdk bootstrap

# Clear CDK cache
rm cdk.context.json
```

**Frontend can't reach API**:
- Check CORS configuration
- Verify API URL in `.env`
- Check browser console for errors

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on:
- Code of conduct
- How to report bugs
- How to suggest features
- Pull request process
