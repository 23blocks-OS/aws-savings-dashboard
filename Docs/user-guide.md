# User Guide

Welcome to the AWS Savings Dashboard! This guide will help you manage your AWS Instance Scheduler configurations through an intuitive web interface.

## Table of Contents

1. [Overview](#overview)
2. [Dashboard](#dashboard)
3. [Managing Periods](#managing-periods)
4. [Managing Schedules](#managing-schedules)
5. [Viewing Instances](#viewing-instances)
6. [Analytics & Savings](#analytics--savings)
7. [Settings](#settings)
8. [Best Practices](#best-practices)

## Overview

The AWS Savings Dashboard provides a user-friendly interface for managing AWS Instance Scheduler, which automates starting and stopping EC2 and RDS instances to reduce costs.

### Key Concepts

- **Period**: Defines when instances should run (time ranges, days, months)
- **Schedule**: Combines one or more periods to create a scheduling policy
- **Tag**: EC2/RDS instances are tagged with a schedule name to apply the policy
- **Savings**: Estimated cost reduction from shutting down instances when not needed

## Dashboard

The dashboard provides an at-a-glance view of your instance scheduling:

### Overview Cards

- **Total Instances**: All EC2 and RDS instances in your account
- **Scheduled Instances**: Instances with a schedule tag assigned
- **Active Schedules**: Number of schedules currently configured
- **Monthly Savings**: Estimated monthly cost reduction

### Instance Status

Shows breakdown of running vs stopped instances.

### Upcoming Events

Displays the next start/stop actions that will occur in the next 24 hours.

## Managing Periods

Periods define time windows when instances should be running.

### Creating a Period

1. Navigate to **Periods** in the sidebar
2. Click **Create Period**
3. Fill in the form:
   - **Name**: Unique identifier (e.g., `office-hours`)
   - **Description**: Optional description
   - **Begin Time**: When to start instances (HH:MM format, e.g., `09:00`)
   - **End Time**: When to stop instances (HH:MM format, e.g., `17:00`)
   - **Weekdays**: Which days to apply (e.g., `Mon-Fri`)
   - **Month Days**: Specific days of month (e.g., `1-15`)
   - **Months**: Which months to apply (e.g., `Jan-Jun`)
4. Click **Create**

### Period Examples

**Office Hours (Weekdays)**
```
Name: office-hours
Begin Time: 09:00
End Time: 17:00
Weekdays: Mon-Fri
```

**Weekend Maintenance**
```
Name: weekend-maintenance
Begin Time: 08:00
End Time: 18:00
Weekdays: Sat-Sun
```

**First Half of Month**
```
Name: first-half-month
Begin Time: 00:00
End Time: 23:59
Month Days: 1-15
```

**Business Season**
```
Name: business-season
Begin Time: 00:00
End Time: 23:59
Months: Jan-Jun
```

### Editing a Period

1. Click the **Edit** icon next to the period
2. Modify the fields
3. Click **Update**

**Note**: Changes affect all schedules using this period.

### Deleting a Period

1. Click the **Delete** icon next to the period
2. Confirm deletion

**Note**: You cannot delete a period that's being used by a schedule.

## Managing Schedules

Schedules combine periods and apply them to instances.

### Creating a Schedule

1. Navigate to **Schedules** in the sidebar
2. Click **Create Schedule**
3. Fill in the form:
   - **Name**: Unique identifier (e.g., `dev-environment`)
   - **Description**: Optional description
   - **Timezone**: Timezone for the schedule (e.g., `US/Eastern`)
   - **Periods**: Select one or more periods
4. Click **Create**

### Schedule Examples

**Development Environment (9-5 Weekdays)**
```
Name: dev-9to5
Description: Development servers running business hours
Timezone: US/Eastern
Periods: office-hours
```

**24/7 Except Weekends**
```
Name: weekday-always-on
Description: Always on Monday-Friday, off on weekends
Timezone: UTC
Periods: weekday-period
```

**Complex Schedule**
```
Name: hybrid-schedule
Description: Different hours for different days
Timezone: US/Pacific
Periods: weekday-hours, weekend-maintenance
```

### Advanced Options

- **Enforced**: Prevents manual start/stop outside scheduled periods
- **Retain Running**: Keeps instances running if manually started before period begins
- **Hibernate**: Uses hibernation instead of stopping (EC2 only)
- **Override Status**: Temporarily override schedule (running/stopped)

### Editing a Schedule

1. Click the **Edit** icon next to the schedule
2. Modify the fields
3. Click **Update**

### Deleting a Schedule

1. Click the **Delete** icon next to the schedule
2. Confirm deletion

**Note**: You cannot delete a schedule that's assigned to instances. Remove the tag from instances first.

## Viewing Instances

The Instances page shows all EC2 and RDS instances across your configured regions.

### Instance Information

For each instance, you can see:
- **Instance ID**: AWS identifier
- **Name**: Instance name tag
- **Service**: EC2 or RDS
- **Type**: Instance type (e.g., t3.micro, db.t3.small)
- **State**: Current state (running, stopped, available)
- **Schedule**: Assigned schedule (if any)
- **Region**: AWS region

### Filtering Instances

Use the filters to narrow down the list:
- **Service**: Show only EC2 or RDS instances
- **State**: Show only running or stopped instances
- **Region**: Filter by AWS region
- **Schedule**: Show instances with a specific schedule

### Assigning Schedules to Instances

To assign a schedule to instances:

1. Go to AWS Console → EC2 or RDS
2. Select the instance(s)
3. Add/Edit tags
4. Create a tag:
   - **Key**: `Schedule` (or your custom tag name from Settings)
   - **Value**: Schedule name (e.g., `dev-9to5`)

The dashboard will automatically detect the tag and show the schedule assignment.

## Analytics & Savings

The Analytics page provides detailed cost savings analysis.

### Metrics

- **Total Instances**: All instances in your account
- **Managed Instances**: Instances with schedules assigned
- **Monthly Savings**: Estimated monthly cost reduction
- **Yearly Savings**: Estimated annual cost reduction

### Savings Breakdown

View savings by:
- **Service**: EC2 vs RDS savings
- **Region**: Savings per AWS region
- **Account**: Savings per AWS account (multi-account setups)

### How Savings Are Calculated

```
Monthly Savings = Hourly Rate × Hours Saved per Month

Where:
- Hourly Rate: On-demand price for the instance type
- Hours Saved: (730 - Hours Running per Month)
- Hours Running: Based on schedule periods
```

### Example Calculation

**Instance**: t3.medium EC2 in us-east-1
**Hourly Rate**: $0.0416
**Schedule**: 9am-5pm weekdays (40 hours/week = 173 hours/month)
**Hours Saved**: 730 - 173 = 557 hours/month
**Monthly Savings**: $0.0416 × 557 = $23.17

For 10 such instances: **$231.70/month** = **$2,780/year**

## Settings

Global configuration for the Instance Scheduler integration.

### Configuration Options

- **Schedule Tag Name**: Tag key used to assign schedules (default: `Schedule`)
- **Default Timezone**: Default timezone for new schedules (default: `UTC`)
- **Regions**: AWS regions to monitor for instances (comma-separated)

### Changing Settings

1. Navigate to **Settings**
2. Modify the values
3. Click **Save Settings**

**Note**: Changes to the tag name or regions require redeployment of the Instance Scheduler.

## Best Practices

### 1. Start with Periods

Create periods for common time windows first:
- Office hours (9am-5pm)
- Extended hours (7am-7pm)
- Weekends only
- Business hours by timezone

### 2. Use Descriptive Names

Good names:
- `dev-office-hours`
- `prod-24x7-weekdays`
- `test-evening-batch`

Avoid:
- `schedule1`
- `temp`
- `test`

### 3. Test on Dev Instances First

Before applying schedules to production:
1. Create a test schedule
2. Assign to a non-critical dev instance
3. Monitor for 24-48 hours
4. Verify start/stop times are correct
5. Then apply to more instances

### 4. Use Timezone Awareness

- Development teams in US/Eastern? Use `US/Eastern`
- Global team? Use `UTC` and adjust times accordingly
- Multiple regions? Create separate schedules per timezone

### 5. Monitor Savings Regularly

- Check Analytics page weekly
- Identify instances without schedules
- Look for opportunities to reduce running hours
- Adjust schedules based on actual usage

### 6. Document Your Schedules

Add descriptions to schedules:
```
Name: api-backend-schedule
Description: API servers for dev environment
             Running 8am-8pm Mon-Fri US/Eastern
             Supports dev team working hours
Periods: dev-hours
```

### 7. Use Override Status Wisely

The `override_status` feature is useful for:
- **Testing**: Keep instances running while debugging
- **Incidents**: Keep instances stopped during maintenance
- **Demos**: Ensure instances are running for presentations

Remember to remove overrides when done!

### 8. Combine Multiple Periods

Create complex schedules by combining periods:

```
Schedule: hybrid-work
Periods:
  - core-hours (9am-3pm Mon-Fri)
  - flex-hours (7am-9am, 3pm-7pm Mon-Fri)
  - weekend-on-call (8am-6pm Sat-Sun)
```

### 9. Review and Optimize

Monthly review:
1. Check which instances use the most compute time
2. Identify instances running 24/7 that could be scheduled
3. Adjust periods based on actual usage patterns
4. Remove unused schedules and periods

### 10. Cost Tagging

Use additional tags for cost allocation:
```
Schedule: dev-9to5
Team: backend-team
Project: api-v2
CostCenter: engineering
```

This helps track savings by team or project.

## Common Scenarios

### Scenario 1: Development Environment (Weekday 9-5)

```
Period: dev-hours
  Begin: 09:00
  End: 17:00
  Weekdays: Mon-Fri

Schedule: dev-environment
  Periods: dev-hours
  Timezone: US/Eastern
```

**Savings**: ~65% (117 hours/week vs 168 hours)

### Scenario 2: Test Environment (Extended Hours)

```
Period: extended-hours
  Begin: 07:00
  End: 21:00
  Weekdays: Mon-Fri

Schedule: test-environment
  Periods: extended-hours
  Timezone: US/Pacific
```

**Savings**: ~58% (70 hours/week vs 168 hours)

### Scenario 3: Batch Processing (Nights Only)

```
Period: night-batch
  Begin: 22:00
  End: 06:00
  Weekdays: Mon-Fri

Schedule: batch-jobs
  Periods: night-batch
  Timezone: UTC
```

**Savings**: ~52% (40 hours/week vs 168 hours)

### Scenario 4: 24/7 Except Weekends

```
Period: weekdays-all-day
  Begin: 00:00
  End: 23:59
  Weekdays: Mon-Fri

Schedule: weekday-always-on
  Periods: weekdays-all-day
  Timezone: UTC
```

**Savings**: ~29% (120 hours/week vs 168 hours)

## Troubleshooting

### Instance Not Starting/Stopping

**Check**:
1. Tag name matches Settings configuration
2. Tag value matches exact schedule name
3. Schedule has valid periods defined
4. Current time falls within/outside period definition
5. Override status is not set

### Incorrect Start/Stop Times

**Check**:
1. Timezone is correct for your region
2. Period times are in HH:MM format
3. Weekday abbreviations are correct (Mon, Tue, etc.)
4. No typos in period definitions

### Dashboard Shows No Instances

**Check**:
1. Regions configured in Settings
2. AWS credentials have EC2/RDS read permissions
3. Instances exist in the configured regions

## Support

For issues or questions:
- Check the [API Reference](./api-reference.md)
- Review [Deployment Guide](./deployment.md)
- Open an issue on GitHub
