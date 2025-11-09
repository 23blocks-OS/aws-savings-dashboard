#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { DashboardStack } from '../lib/dashboard-stack';

const app = new cdk.App();

// Configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Get the Instance Scheduler config table name from context or environment
const configTableName = app.node.tryGetContext('configTableName') ||
  process.env.CONFIG_TABLE_NAME ||
  'InstanceScheduler-ConfigTable';

const scheduleTagName = app.node.tryGetContext('scheduleTagName') ||
  process.env.SCHEDULE_TAG_NAME ||
  'Schedule';

// API Stack
const apiStack = new ApiStack(app, 'AwsSavingsDashboardApiStack', {
  env,
  configTableName,
  scheduleTagName,
  description: 'API Stack for AWS Savings Dashboard',
});

// Dashboard Stack
const dashboardStack = new DashboardStack(app, 'AwsSavingsDashboardStack', {
  env,
  apiUrl: apiStack.api.url,
  description: 'Frontend Stack for AWS Savings Dashboard',
});

dashboardStack.addDependency(apiStack);

app.synth();
