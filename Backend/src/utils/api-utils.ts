import { APIGatewayProxyResult } from 'aws-lambda';

export function createResponse(
  statusCode: number,
  body: any
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: body !== null ? JSON.stringify(body) : '',
  };
}

export function handleError(error: any): APIGatewayProxyResult {
  console.error('Error:', error);

  const message = error.message || 'Internal server error';
  const statusCode = error.statusCode || 500;

  return createResponse(statusCode, {
    error: error.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
