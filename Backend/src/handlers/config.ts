import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBRepository } from '../repositories/dynamodb-repository';
import { ConfigSchema } from '../types';
import { createResponse, handleError } from '../utils/api-utils';

const dbRepo = new DynamoDBRepository();

export async function getConfig(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const config = await dbRepo.getConfig();
    if (!config) {
      return createResponse(404, { error: 'Configuration not found' });
    }

    return createResponse(200, config);
  } catch (error) {
    return handleError(error);
  }
}

export async function updateConfig(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate request body
    const validation = ConfigSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const updates = validation.data;
    const updated = await dbRepo.updateConfig(updates);

    return createResponse(200, updated);
  } catch (error) {
    return handleError(error);
  }
}
