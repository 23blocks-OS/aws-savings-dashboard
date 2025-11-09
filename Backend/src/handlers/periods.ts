import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBRepository } from '../repositories/dynamodb-repository';
import { PeriodSchema } from '../types';
import { createResponse, handleError } from '../utils/api-utils';

const dbRepo = new DynamoDBRepository();

export async function listPeriods(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const periods = await dbRepo.listPeriods();
    return createResponse(200, { items: periods, count: periods.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function getPeriod(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const name = event.pathParameters?.name;
    if (!name) {
      return createResponse(400, { error: 'Period name is required' });
    }

    const period = await dbRepo.getPeriod(name);
    if (!period) {
      return createResponse(404, { error: 'Period not found' });
    }

    return createResponse(200, period);
  } catch (error) {
    return handleError(error);
  }
}

export async function createPeriod(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate request body
    const validation = PeriodSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const periodData = validation.data;

    const period = {
      type: 'period' as const,
      name: periodData.name,
      begintime: periodData.begintime,
      endtime: periodData.endtime,
      weekdays: periodData.weekdays,
      monthdays: periodData.monthdays,
      months: periodData.months,
      description: periodData.description,
    };

    const created = await dbRepo.createPeriod(period);

    return createResponse(201, created);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      return createResponse(409, { error: error.message });
    }
    return handleError(error);
  }
}

export async function updatePeriod(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const name = event.pathParameters?.name;
    if (!name) {
      return createResponse(400, { error: 'Period name is required' });
    }

    const body = JSON.parse(event.body || '{}');

    // Validate request body (partial schema)
    const validation = PeriodSchema.partial().safeParse(body);
    if (!validation.success) {
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const updates = validation.data;
    const updated = await dbRepo.updatePeriod(name, updates);

    return createResponse(200, updated);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return createResponse(404, { error: error.message });
    }
    return handleError(error);
  }
}

export async function deletePeriod(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const name = event.pathParameters?.name;
    if (!name) {
      return createResponse(400, { error: 'Period name is required' });
    }

    await dbRepo.deletePeriod(name);

    return createResponse(204, null);
  } catch (error: any) {
    if (error.message?.includes('is used by')) {
      return createResponse(409, { error: error.message });
    }
    return handleError(error);
  }
}
