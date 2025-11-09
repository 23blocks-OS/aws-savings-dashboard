import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBRepository } from '../repositories/dynamodb-repository';
import { InstanceRepository } from '../repositories/instance-repository';
import { ScheduleService } from '../services/schedule-service';
import { ScheduleSchema } from '../types';
import { createResponse, handleError } from '../utils/api-utils';

const dbRepo = new DynamoDBRepository();
const instanceRepo = new InstanceRepository();
const scheduleService = new ScheduleService(dbRepo, instanceRepo);

export async function listSchedules(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const schedules = await dbRepo.listSchedules();
    return createResponse(200, { items: schedules, count: schedules.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function getSchedule(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const name = event.pathParameters?.name;
    if (!name) {
      return createResponse(400, { error: 'Schedule name is required' });
    }

    const result = await scheduleService.getScheduleWithInstances(name);
    if (!result.schedule) {
      return createResponse(404, { error: 'Schedule not found' });
    }

    return createResponse(200, result);
  } catch (error) {
    return handleError(error);
  }
}

export async function createSchedule(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate request body
    const validation = ScheduleSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const scheduleData = validation.data;

    // Build schedule object
    const schedule = {
      type: 'schedule' as const,
      name: scheduleData.name,
      periods: scheduleData.periods,
      timezone: scheduleData.timezone,
      description: scheduleData.description,
      enforced: scheduleData.enforced,
      retain_running: scheduleData.retain_running,
      hibernate: scheduleData.hibernate,
      override_status: scheduleData.override_status,
      ssm_maintenance_window: scheduleData.ssm_maintenance_window,
    };

    // Validate schedule
    await scheduleService.validateSchedule(schedule);

    // Create schedule
    const created = await dbRepo.createSchedule(schedule);

    return createResponse(201, created);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      return createResponse(409, { error: error.message });
    }
    return handleError(error);
  }
}

export async function updateSchedule(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const name = event.pathParameters?.name;
    if (!name) {
      return createResponse(400, { error: 'Schedule name is required' });
    }

    const body = JSON.parse(event.body || '{}');

    // Validate request body (partial schema)
    const validation = ScheduleSchema.partial().safeParse(body);
    if (!validation.success) {
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const updates = validation.data;

    // If periods are being updated, validate them
    if (updates.periods) {
      const tempSchedule = {
        type: 'schedule' as const,
        name,
        periods: updates.periods,
      };
      await scheduleService.validateSchedule(tempSchedule as any);
    }

    // Update schedule
    const updated = await dbRepo.updateSchedule(name, updates);

    return createResponse(200, updated);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return createResponse(404, { error: error.message });
    }
    return handleError(error);
  }
}

export async function deleteSchedule(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const name = event.pathParameters?.name;
    if (!name) {
      return createResponse(400, { error: 'Schedule name is required' });
    }

    // Check if schedule is being used by instances
    const instances = await instanceRepo.filterInstancesBySchedule(name);
    if (instances.length > 0) {
      return createResponse(409, {
        error: `Cannot delete schedule '${name}' because it is assigned to ${instances.length} instance(s)`,
        details: {
          instanceCount: instances.length,
          instances: instances.map(i => i.id),
        },
      });
    }

    await dbRepo.deleteSchedule(name);

    return createResponse(204, null);
  } catch (error) {
    return handleError(error);
  }
}

export async function getScheduleForecast(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const name = event.pathParameters?.name;
    if (!name) {
      return createResponse(400, { error: 'Schedule name is required' });
    }

    const daysAhead = parseInt(event.queryStringParameters?.days || '7');
    const instanceId = event.queryStringParameters?.instanceId || 'preview';

    const forecast = await scheduleService.forecastSchedule(name, instanceId, daysAhead);

    return createResponse(200, forecast);
  } catch (error) {
    return handleError(error);
  }
}
