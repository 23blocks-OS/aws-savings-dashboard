import { EC2Client, DescribeInstancesCommand, DescribeRegionsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import { Instance } from '../types';

export class InstanceRepository {
  private ec2Client: EC2Client;
  private rdsClient: RDSClient;
  private scheduleTagName: string;

  constructor(region?: string, scheduleTagName?: string) {
    const clientRegion = region || process.env.AWS_REGION || 'us-east-1';
    this.ec2Client = new EC2Client({ region: clientRegion });
    this.rdsClient = new RDSClient({ region: clientRegion });
    this.scheduleTagName = scheduleTagName || process.env.SCHEDULE_TAG_NAME || 'Schedule';
  }

  async listEC2Instances(region?: string): Promise<Instance[]> {
    const client = region ? new EC2Client({ region }) : this.ec2Client;

    const command = new DescribeInstancesCommand({});
    const response = await client.send(command);

    const instances: Instance[] = [];

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        const tags = instance.Tags?.reduce((acc, tag) => {
          if (tag.Key && tag.Value) {
            acc[tag.Key] = tag.Value;
          }
          return acc;
        }, {} as Record<string, string>) || {};

        const nameTag = tags['Name'] || '';
        const schedule = tags[this.scheduleTagName];

        instances.push({
          id: instance.InstanceId || '',
          name: nameTag,
          type: instance.InstanceType || '',
          service: 'ec2',
          state: instance.State?.Name || 'unknown',
          schedule: schedule,
          account: await this.getAccountId(),
          region: region || process.env.AWS_REGION || 'us-east-1',
          instanceType: instance.InstanceType,
          tags: tags,
        });
      }
    }

    return instances;
  }

  async listRDSInstances(region?: string): Promise<Instance[]> {
    const client = region ? new RDSClient({ region }) : this.rdsClient;

    const command = new DescribeDBInstancesCommand({});
    const response = await client.send(command);

    const instances: Instance[] = [];

    for (const dbInstance of response.DBInstances || []) {
      const tags = dbInstance.TagList?.reduce((acc, tag) => {
        if (tag.Key && tag.Value) {
          acc[tag.Key] = tag.Value;
        }
        return acc;
      }, {} as Record<string, string>) || {};

      const schedule = tags[this.scheduleTagName];

      instances.push({
        id: dbInstance.DBInstanceIdentifier || '',
        name: dbInstance.DBInstanceIdentifier,
        type: dbInstance.DBInstanceClass || '',
        service: 'rds',
        state: dbInstance.DBInstanceStatus || 'unknown',
        schedule: schedule,
        account: await this.getAccountId(),
        region: region || process.env.AWS_REGION || 'us-east-1',
        instanceType: dbInstance.DBInstanceClass,
        engine: dbInstance.Engine,
        tags: tags,
      });
    }

    return instances;
  }

  async listRDSClusters(region?: string): Promise<Instance[]> {
    const client = region ? new RDSClient({ region }) : this.rdsClient;

    const command = new DescribeDBClustersCommand({});
    const response = await client.send(command);

    const instances: Instance[] = [];

    for (const cluster of response.DBClusters || []) {
      const tags = cluster.TagList?.reduce((acc, tag) => {
        if (tag.Key && tag.Value) {
          acc[tag.Key] = tag.Value;
        }
        return acc;
      }, {} as Record<string, string>) || {};

      const schedule = tags[this.scheduleTagName];

      instances.push({
        id: cluster.DBClusterIdentifier || '',
        name: cluster.DBClusterIdentifier,
        type: 'cluster',
        service: 'rds',
        state: cluster.Status || 'unknown',
        schedule: schedule,
        account: await this.getAccountId(),
        region: region || process.env.AWS_REGION || 'us-east-1',
        instanceType: 'cluster',
        engine: cluster.Engine,
        tags: tags,
      });
    }

    return instances;
  }

  async listAllInstances(regions?: string[]): Promise<Instance[]> {
    const regionsToCheck = regions || await this.getEnabledRegions();
    const allInstances: Instance[] = [];

    for (const region of regionsToCheck) {
      try {
        const ec2Instances = await this.listEC2Instances(region);
        const rdsInstances = await this.listRDSInstances(region);
        const rdsClusters = await this.listRDSClusters(region);

        allInstances.push(...ec2Instances, ...rdsInstances, ...rdsClusters);
      } catch (error) {
        console.error(`Error fetching instances from region ${region}:`, error);
        // Continue with other regions even if one fails
      }
    }

    return allInstances;
  }

  async getEnabledRegions(): Promise<string[]> {
    try {
      const command = new DescribeRegionsCommand({
        AllRegions: false, // Only enabled regions
      });
      const response = await this.ec2Client.send(command);
      return response.Regions?.map(r => r.RegionName || '').filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching regions:', error);
      // Return default regions if API call fails
      return ['us-east-1', 'us-west-2', 'eu-west-1'];
    }
  }

  private async getAccountId(): Promise<string> {
    // In a real implementation, you would fetch this from STS
    // For now, return from environment or a placeholder
    return process.env.AWS_ACCOUNT_ID || 'unknown';
  }

  async filterInstancesBySchedule(schedule: string, instances?: Instance[]): Promise<Instance[]> {
    const allInstances = instances || await this.listAllInstances();
    return allInstances.filter(instance => instance.schedule === schedule);
  }

  async getInstancesByIds(instanceIds: string[]): Promise<Instance[]> {
    const allInstances = await this.listAllInstances();
    const idSet = new Set(instanceIds);
    return allInstances.filter(instance => idSet.has(instance.id));
  }
}
