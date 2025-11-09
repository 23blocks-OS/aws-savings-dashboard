import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  configTableName: string;
  scheduleTagName?: string;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { configTableName, scheduleTagName = 'Schedule' } = props;

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add permissions for DynamoDB
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Scan',
        'dynamodb:Query',
      ],
      resources: [
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${configTableName}`,
      ],
    }));

    // Add permissions for EC2 and RDS read access
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:DescribeInstances',
        'ec2:DescribeRegions',
        'rds:DescribeDBInstances',
        'rds:DescribeDBClusters',
      ],
      resources: ['*'],
    }));

    // Lambda function for API handlers
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../Backend/dist'),
      role: lambdaRole,
      environment: {
        CONFIG_TABLE_NAME: configTableName,
        SCHEDULE_TAG_NAME: scheduleTagName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'SavingsDashboardApi', {
      restApiName: 'AWS Savings Dashboard API',
      description: 'API for AWS Savings Dashboard',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction);

    // Schedules endpoints
    const schedules = this.api.root.addResource('schedules');
    schedules.addMethod('GET', lambdaIntegration);
    schedules.addMethod('POST', lambdaIntegration);

    const schedule = schedules.addResource('{name}');
    schedule.addMethod('GET', lambdaIntegration);
    schedule.addMethod('PUT', lambdaIntegration);
    schedule.addMethod('DELETE', lambdaIntegration);

    const scheduleForecast = schedule.addResource('forecast');
    scheduleForecast.addMethod('GET', lambdaIntegration);

    // Periods endpoints
    const periods = this.api.root.addResource('periods');
    periods.addMethod('GET', lambdaIntegration);
    periods.addMethod('POST', lambdaIntegration);

    const period = periods.addResource('{name}');
    period.addMethod('GET', lambdaIntegration);
    period.addMethod('PUT', lambdaIntegration);
    period.addMethod('DELETE', lambdaIntegration);

    // Config endpoints
    const config = this.api.root.addResource('config');
    config.addMethod('GET', lambdaIntegration);
    config.addMethod('PUT', lambdaIntegration);

    // Instances endpoints
    const instances = this.api.root.addResource('instances');
    instances.addMethod('GET', lambdaIntegration);

    const instance = instances.addResource('{id}');
    instance.addMethod('GET', lambdaIntegration);

    // Analytics endpoints
    const analytics = this.api.root.addResource('analytics');

    const dashboard = analytics.addResource('dashboard');
    dashboard.addMethod('GET', lambdaIntegration);

    const savings = analytics.addResource('savings');
    savings.addMethod('GET', lambdaIntegration);

    const scheduleSavings = analytics.addResource('schedules').addResource('{name}').addResource('savings');
    scheduleSavings.addMethod('GET', lambdaIntegration);

    const instanceSavings = analytics.addResource('instances').addResource('{id}').addResource('savings');
    instanceSavings.addMethod('GET', lambdaIntegration);

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
    });
  }
}
