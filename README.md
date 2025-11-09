# AWS Savings Dashboard

A modern web UI for managing AWS Instance Scheduler configurations, providing an intuitive interface to schedule EC2 and RDS instances, track cost savings, and manage scheduling policies across multiple AWS accounts.

## What is AWS Instance Scheduler?

AWS Instance Scheduler is an AWS solution that automates the starting and stopping of Amazon EC2 and Amazon RDS instances based on defined schedules. While powerful, it lacks a user-friendly interface for managing configurations stored in DynamoDB.

## What Does This Dashboard Provide?

- **Visual Schedule Management**: Create and edit schedules and periods with an intuitive UI
- **Instance Visibility**: See all managed instances across accounts and regions
- **Cost Savings Analytics**: Track and forecast your savings from scheduled shutdowns
- **Real-time Status**: View current instance states and upcoming start/stop events
- **Simplified Configuration**: No more manual DynamoDB edits or complex CLI commands

## Features

### Schedule Management
- Create, edit, and delete schedules with a visual interface
- Define time periods with an interactive calendar
- Preview schedule timelines before applying
- Support for timezones, maintenance windows, and hibernation

### Instance Management
- View all EC2 and RDS instances across accounts
- Filter by region, account, service type, or schedule
- Bulk assign/unassign schedules
- Forecast next start/stop times

### Analytics & Savings
- Real-time cost savings calculations
- Monthly and yearly savings projections
- Savings breakdown by account, region, and instance type
- Export reports to CSV/PDF

### Dashboard
- Overview of managed instances and active schedules
- Cost savings trends and charts
- Upcoming schedule events (next 24 hours)
- Instance status distribution

## Architecture

This is a monorepo containing:

- **WebDashboard**: React-based SPA with TypeScript and Material-UI
- **Backend**: AWS Lambda functions providing REST API
- **IaC**: Terraform infrastructure definitions for deployment
- **Docs**: Comprehensive documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Quick Start

### Prerequisites
- AWS Account with Instance Scheduler deployed
- Node.js 18+ and npm
- AWS CLI configured
- Terraform >= 1.5 installed

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd aws-savings-dashboard
```

2. Install dependencies:
```bash
# Install Backend dependencies
cd Backend
npm install
cd ..

# Install WebDashboard dependencies
cd WebDashboard
npm install
cd ..
```

3. Configure environment:
```bash
# Copy example environment files
cp Backend/.env.example Backend/.env
cp WebDashboard/.env.example WebDashboard/.env

# Edit with your AWS Instance Scheduler DynamoDB table name
```

4. Start development:
```bash
# Terminal 1: Build backend
cd Backend
npm run build

# Terminal 2: Start frontend
cd WebDashboard
npm run dev
```

5. Open browser to `http://localhost:3000`

### Deployment

See [Docs/deployment.md](./Docs/deployment.md) for full deployment instructions.

Quick deploy:
```bash
# Build backend
cd Backend
npm run build

# Deploy with Terraform
cd ../IaC
terraform init
terraform apply
```

## Project Structure

```
aws-savings-dashboard/
├── WebDashboard/          # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/
├── Backend/               # Lambda functions and API
│   ├── src/
│   │   ├── handlers/      # API endpoint handlers
│   │   ├── services/      # Business logic
│   │   ├── repositories/  # DynamoDB data access
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── tests/
├── IaC/                   # Terraform infrastructure
│   ├── main.tf                # Main configuration
│   ├── variables.tf           # Input variables
│   ├── outputs.tf             # Output values
│   └── modules/
│       ├── api/               # API Gateway + Lambda
│       └── dashboard/         # S3 + CloudFront
└── Docs/                  # Documentation
    ├── user-guide.md
    ├── api-reference.md
    ├── deployment.md
    └── development.md
```

## Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [User Guide](./Docs/user-guide.md)
- [API Reference](./Docs/api-reference.md)
- [Deployment Guide](./Docs/deployment.md)
- [Development Guide](./Docs/development.md)

## Key Technologies

- **Frontend**: React 18, TypeScript, Material-UI, React Query, Recharts
- **Backend**: Node.js 20, TypeScript, AWS SDK v3
- **Infrastructure**: Terraform, Lambda, API Gateway, S3, CloudFront, DynamoDB
- **Testing**: Jest, React Testing Library

## Cost Considerations

This dashboard adds minimal cost to your AWS bill:
- **Lambda**: Pay per request (typically < $5/month)
- **API Gateway**: Pay per request (typically < $5/month)
- **S3 + CloudFront**: Static hosting (typically < $2/month)
- **Total Estimated Cost**: < $15/month

The savings from using Instance Scheduler typically far exceed these costs (often $1000s/month).

## Security

- Authentication via Amazon Cognito
- IAM-based authorization for API access
- Least privilege access to DynamoDB
- All API calls logged via CloudTrail
- CloudFront with HTTPS only

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- Issues: GitHub Issues
- Documentation: [Docs](./Docs/)
- AWS Instance Scheduler: [AWS Documentation](https://docs.aws.amazon.com/solutions/latest/instance-scheduler-on-aws/)

## Roadmap

- [ ] Multi-tenant support
- [ ] Email/Slack notifications
- [ ] Approval workflows
- [ ] Schedule templates library
- [ ] AI-powered schedule recommendations
- [ ] Mobile app
- [ ] CDK IaC alternative
