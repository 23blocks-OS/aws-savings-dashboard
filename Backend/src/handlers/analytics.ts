import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBRepository } from '../repositories/dynamodb-repository';
import { InstanceRepository } from '../repositories/instance-repository';
import { ScheduleService } from '../services/schedule-service';
import { AnalyticsService } from '../services/analytics-service';
import { createResponse, handleError } from '../utils/api-utils';

const dbRepo = new DynamoDBRepository();
const instanceRepo = new InstanceRepository();
const scheduleService = new ScheduleService(dbRepo, instanceRepo);
const analyticsService = new AnalyticsService(dbRepo, instanceRepo, scheduleService);

export async function getDashboard(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const stats = await analyticsService.getDashboardStats();
    return createResponse(200, stats);
  } catch (error) {
    return handleError(error);
  }
}

export async function getSavingsSummary(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const summary = await analyticsService.calculateTotalSavings();
    return createResponse(200, summary);
  } catch (error) {
    return handleError(error);
  }
}

export async function getScheduleSavings(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const scheduleName = event.pathParameters?.name;
    if (!scheduleName) {
      return createResponse(400, { error: 'Schedule name is required' });
    }

    const savings = await analyticsService.getSavingsBySchedule(scheduleName);
    return createResponse(200, savings);
  } catch (error) {
    return handleError(error);
  }
}

export async function getInstanceSavings(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const instanceId = event.pathParameters?.id;
    if (!instanceId) {
      return createResponse(400, { error: 'Instance ID is required' });
    }

    const instances = await instanceRepo.getInstancesByIds([instanceId]);
    if (instances.length === 0) {
      return createResponse(404, { error: 'Instance not found' });
    }

    const savings = await analyticsService.calculateInstanceSavings(instances[0]);
    return createResponse(200, savings);
  } catch (error) {
    return handleError(error);
  }
}
