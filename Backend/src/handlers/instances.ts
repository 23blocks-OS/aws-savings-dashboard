import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InstanceRepository } from '../repositories/instance-repository';
import { DynamoDBRepository } from '../repositories/dynamodb-repository';
import { createResponse, handleError } from '../utils/api-utils';

const instanceRepo = new InstanceRepository();
const dbRepo = new DynamoDBRepository();

export async function listInstances(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const config = await dbRepo.getConfig();
    const regions = config?.regions;

    const instances = await instanceRepo.listAllInstances(regions);

    // Apply filters from query parameters
    let filtered = instances;

    const serviceFilter = event.queryStringParameters?.service;
    if (serviceFilter) {
      filtered = filtered.filter(i => i.service === serviceFilter);
    }

    const regionFilter = event.queryStringParameters?.region;
    if (regionFilter) {
      filtered = filtered.filter(i => i.region === regionFilter);
    }

    const scheduleFilter = event.queryStringParameters?.schedule;
    if (scheduleFilter) {
      filtered = filtered.filter(i => i.schedule === scheduleFilter);
    }

    const stateFilter = event.queryStringParameters?.state;
    if (stateFilter) {
      filtered = filtered.filter(i => i.state === stateFilter);
    }

    return createResponse(200, { items: filtered, count: filtered.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function getInstance(
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

    return createResponse(200, instances[0]);
  } catch (error) {
    return handleError(error);
  }
}
