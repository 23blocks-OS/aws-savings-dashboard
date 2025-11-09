import { DynamoDBRepository } from '../repositories/dynamodb-repository';
import { InstanceRepository } from '../repositories/instance-repository';
import { ScheduleService } from './schedule-service';
import { SavingsCalculation, AnalyticsSummary, DashboardStats, Instance } from '../types';

// Simplified pricing data - in production, use AWS Pricing API
const EC2_PRICING: Record<string, number> = {
  't2.micro': 0.0116,
  't2.small': 0.023,
  't2.medium': 0.0464,
  't3.micro': 0.0104,
  't3.small': 0.0208,
  't3.medium': 0.0416,
  't3.large': 0.0832,
  'm5.large': 0.096,
  'm5.xlarge': 0.192,
  'm5.2xlarge': 0.384,
  'c5.large': 0.085,
  'c5.xlarge': 0.17,
  'r5.large': 0.126,
  'r5.xlarge': 0.252,
};

const RDS_PRICING: Record<string, number> = {
  'db.t2.micro': 0.017,
  'db.t2.small': 0.034,
  'db.t2.medium': 0.068,
  'db.t3.micro': 0.016,
  'db.t3.small': 0.032,
  'db.t3.medium': 0.064,
  'db.m5.large': 0.171,
  'db.m5.xlarge': 0.342,
  'db.r5.large': 0.24,
  'db.r5.xlarge': 0.48,
};

export class AnalyticsService {
  constructor(
    private dbRepo: DynamoDBRepository,
    private instanceRepo: InstanceRepository,
    private scheduleService: ScheduleService
  ) {}

  async calculateInstanceSavings(instance: Instance): Promise<SavingsCalculation> {
    const hourlyRate = this.getHourlyRate(instance);

    // Get schedule if instance has one
    let hoursPerMonth = 730; // Default: always on
    let hoursSaved = 0;

    if (instance.schedule) {
      try {
        const schedule = await this.dbRepo.getSchedule(instance.schedule);
        if (schedule) {
          const periods = await Promise.all(
            schedule.periods.map(name => this.dbRepo.getPeriod(name))
          );
          const validPeriods = periods.filter(p => p !== null);

          hoursPerMonth = await this.scheduleService.calculateScheduleRuntime(
            schedule,
            validPeriods as any[]
          );
          hoursSaved = 730 - hoursPerMonth;
        }
      } catch (error) {
        console.error(`Error calculating savings for instance ${instance.id}:`, error);
      }
    }

    const monthlyCost = hoursPerMonth * hourlyRate;
    const monthlySavings = hoursSaved * hourlyRate;
    const yearlySavings = monthlySavings * 12;

    return {
      instanceId: instance.id,
      instanceType: instance.type,
      region: instance.region,
      service: instance.service,
      hoursPerMonth,
      hoursSaved,
      hourlyRate,
      monthlyCost,
      monthlySavings,
      yearlySavings,
    };
  }

  async calculateTotalSavings(instances?: Instance[]): Promise<AnalyticsSummary> {
    const allInstances = instances || await this.instanceRepo.listAllInstances();

    const savingsPromises = allInstances.map(instance =>
      this.calculateInstanceSavings(instance)
    );

    const savings = await Promise.all(savingsPromises);

    const totalMonthlySavings = savings.reduce(
      (sum, s) => sum + s.monthlySavings,
      0
    );
    const totalYearlySavings = totalMonthlySavings * 12;

    const savingsByAccount: Record<string, number> = {};
    const savingsByRegion: Record<string, number> = {};
    const savingsByService: Record<string, number> = {};

    for (const instance of allInstances) {
      const instanceSavings = savings.find(s => s.instanceId === instance.id);
      if (!instanceSavings) continue;

      // By account
      savingsByAccount[instance.account] =
        (savingsByAccount[instance.account] || 0) + instanceSavings.monthlySavings;

      // By region
      savingsByRegion[instance.region] =
        (savingsByRegion[instance.region] || 0) + instanceSavings.monthlySavings;

      // By service
      savingsByService[instance.service] =
        (savingsByService[instance.service] || 0) + instanceSavings.monthlySavings;
    }

    const scheduledInstances = allInstances.filter(i => i.schedule).length;
    const schedules = await this.dbRepo.listSchedules();

    return {
      totalInstances: allInstances.length,
      managedInstances: scheduledInstances,
      activeSchedules: schedules.length,
      totalMonthlySavings,
      totalYearlySavings,
      savingsByAccount,
      savingsByRegion,
      savingsByService,
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const instances = await this.instanceRepo.listAllInstances();
    const schedules = await this.dbRepo.listSchedules();
    const periods = await this.dbRepo.listPeriods();

    const runningInstances = instances.filter(
      i => i.state === 'running' || i.state === 'available'
    ).length;

    const stoppedInstances = instances.filter(
      i => i.state === 'stopped'
    ).length;

    const scheduledInstances = instances.filter(i => i.schedule).length;

    const analytics = await this.calculateTotalSavings(instances);

    // Get upcoming events for next 24 hours
    const upcomingEvents = await this.getUpcomingEvents(24);

    return {
      totalInstances: instances.length,
      runningInstances,
      stoppedInstances,
      scheduledInstances,
      activeSchedules: schedules.length,
      activePeriods: periods.length,
      estimatedMonthlySavings: analytics.totalMonthlySavings,
      upcomingEvents: upcomingEvents.slice(0, 10), // Limit to 10 events
    };
  }

  private async getUpcomingEvents(hours: number) {
    const instances = await this.instanceRepo.listAllInstances();
    const scheduledInstances = instances.filter(i => i.schedule);

    const allEvents = [];

    for (const instance of scheduledInstances) {
      if (!instance.schedule) continue;

      try {
        const forecast = await this.scheduleService.forecastSchedule(
          instance.schedule,
          instance.id,
          Math.ceil(hours / 24)
        );

        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() + hours);

        const relevantEvents = forecast.nextEvents.filter(
          event => new Date(event.timestamp) <= cutoffTime
        );

        allEvents.push(...relevantEvents);
      } catch (error) {
        console.error(`Error getting forecast for instance ${instance.id}:`, error);
      }
    }

    // Sort by timestamp
    return allEvents.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private getHourlyRate(instance: Instance): number {
    const pricing = instance.service === 'ec2' ? EC2_PRICING : RDS_PRICING;

    // Try exact match first
    if (instance.instanceType && pricing[instance.instanceType]) {
      return pricing[instance.instanceType];
    }

    // Try partial match (e.g., "t2.micro" from "t2.micro.something")
    if (instance.instanceType) {
      for (const [type, rate] of Object.entries(pricing)) {
        if (instance.instanceType.includes(type) || type.includes(instance.instanceType)) {
          return rate;
        }
      }
    }

    // Default fallback rate
    return instance.service === 'ec2' ? 0.05 : 0.08;
  }

  async getSavingsBySchedule(scheduleName: string): Promise<{
    schedule: string;
    instanceCount: number;
    totalMonthlySavings: number;
    totalYearlySavings: number;
    instances: SavingsCalculation[];
  }> {
    const instances = await this.instanceRepo.filterInstancesBySchedule(scheduleName);
    const savings = await Promise.all(
      instances.map(i => this.calculateInstanceSavings(i))
    );

    const totalMonthlySavings = savings.reduce((sum, s) => sum + s.monthlySavings, 0);

    return {
      schedule: scheduleName,
      instanceCount: instances.length,
      totalMonthlySavings,
      totalYearlySavings: totalMonthlySavings * 12,
      instances: savings,
    };
  }
}
