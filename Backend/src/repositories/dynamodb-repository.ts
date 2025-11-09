import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Schedule, Period, Config } from '../types';

export class DynamoDBRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName?: string) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName || process.env.CONFIG_TABLE_NAME || '';

    if (!this.tableName) {
      throw new Error('CONFIG_TABLE_NAME environment variable is required');
    }
  }

  // Schedule operations
  async getSchedule(name: string): Promise<Schedule | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        type: 'schedule',
        name: name,
      },
    });

    const response = await this.docClient.send(command);
    return response.Item as Schedule || null;
  }

  async listSchedules(): Promise<Schedule[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': 'schedule',
      },
    });

    const response = await this.docClient.send(command);
    return (response.Items || []) as Schedule[];
  }

  async createSchedule(schedule: Schedule): Promise<Schedule> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        type: 'schedule',
        ...schedule,
      },
      ConditionExpression: 'attribute_not_exists(#name)',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
    });

    try {
      await this.docClient.send(command);
      return schedule;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Schedule '${schedule.name}' already exists`);
      }
      throw error;
    }
  }

  async updateSchedule(name: string, updates: Partial<Schedule>): Promise<Schedule> {
    // First get the existing schedule
    const existing = await this.getSchedule(name);
    if (!existing) {
      throw new Error(`Schedule '${name}' not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      type: 'schedule' as const,
      name, // Ensure name doesn't change
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: updated,
    });

    await this.docClient.send(command);
    return updated;
  }

  async deleteSchedule(name: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        type: 'schedule',
        name: name,
      },
    });

    await this.docClient.send(command);
  }

  // Period operations
  async getPeriod(name: string): Promise<Period | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        type: 'period',
        name: name,
      },
    });

    const response = await this.docClient.send(command);
    return response.Item as Period || null;
  }

  async listPeriods(): Promise<Period[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': 'period',
      },
    });

    const response = await this.docClient.send(command);
    return (response.Items || []) as Period[];
  }

  async createPeriod(period: Period): Promise<Period> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        type: 'period',
        ...period,
      },
      ConditionExpression: 'attribute_not_exists(#name)',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
    });

    try {
      await this.docClient.send(command);
      return period;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Period '${period.name}' already exists`);
      }
      throw error;
    }
  }

  async updatePeriod(name: string, updates: Partial<Period>): Promise<Period> {
    // First get the existing period
    const existing = await this.getPeriod(name);
    if (!existing) {
      throw new Error(`Period '${name}' not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      type: 'period' as const,
      name, // Ensure name doesn't change
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: updated,
    });

    await this.docClient.send(command);
    return updated;
  }

  async deletePeriod(name: string): Promise<void> {
    // Check if period is used by any schedule
    const schedules = await this.listSchedules();
    const usedBy = schedules.filter(s => s.periods.includes(name));

    if (usedBy.length > 0) {
      throw new Error(
        `Cannot delete period '${name}' because it is used by schedules: ${usedBy.map(s => s.name).join(', ')}`
      );
    }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        type: 'period',
        name: name,
      },
    });

    await this.docClient.send(command);
  }

  // Config operations
  async getConfig(): Promise<Config | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        type: 'config',
        name: 'scheduler-config',
      },
    });

    const response = await this.docClient.send(command);
    return response.Item as Config || null;
  }

  async updateConfig(updates: Partial<Config>): Promise<Config> {
    // Get existing config or create default
    let existing = await this.getConfig();

    if (!existing) {
      existing = {
        type: 'config',
        name: 'scheduler-config',
        scheduled_services: ['ec2', 'rds'],
        tagname: 'Schedule',
        default_timezone: 'UTC',
        regions: [],
      };
    }

    const updated = {
      ...existing,
      ...updates,
      type: 'config' as const,
      name: 'scheduler-config',
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: updated,
    });

    await this.docClient.send(command);
    return updated;
  }

  // Validation helper
  async validatePeriods(periodNames: string[]): Promise<void> {
    const periods = await this.listPeriods();
    const existingNames = new Set(periods.map(p => p.name));

    const missing = periodNames.filter(name => !existingNames.has(name));
    if (missing.length > 0) {
      throw new Error(`The following periods do not exist: ${missing.join(', ')}`);
    }
  }
}
