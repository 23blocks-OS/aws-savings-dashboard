import { DynamoDBRepository } from '../repositories/dynamodb-repository';
import { InstanceRepository } from '../repositories/instance-repository';
import { Schedule, Period, ScheduleForecast, ScheduleEvent } from '../types';

export class ScheduleService {
  constructor(
    private dbRepo: DynamoDBRepository,
    private instanceRepo: InstanceRepository
  ) {}

  async getScheduleWithInstances(name: string) {
    const schedule = await this.dbRepo.getSchedule(name);
    if (!schedule) {
      throw new Error(`Schedule '${name}' not found`);
    }

    const instances = await this.instanceRepo.filterInstancesBySchedule(name);

    return {
      schedule,
      instances,
      instanceCount: instances.length,
    };
  }

  async validateSchedule(schedule: Schedule): Promise<void> {
    // Validate that all referenced periods exist
    await this.dbRepo.validatePeriods(schedule.periods);

    // Validate timezone if provided
    if (schedule.timezone) {
      try {
        // Test if timezone is valid by trying to use it
        Intl.DateTimeFormat('en-US', { timeZone: schedule.timezone });
      } catch (error) {
        throw new Error(`Invalid timezone: ${schedule.timezone}`);
      }
    }
  }

  async calculateScheduleRuntime(schedule: Schedule, periods: Period[]): Promise<number> {
    // This is a simplified calculation
    // In a real implementation, you would need to parse the period definitions
    // and calculate the exact runtime hours per month

    let totalMinutesPerWeek = 0;

    for (const periodName of schedule.periods) {
      const period = periods.find(p => p.name === periodName);
      if (!period) continue;

      const { begintime, endtime, weekdays } = period;

      if (begintime && endtime) {
        const [startHour, startMin] = begintime.split(':').map(Number);
        const [endHour, endMin] = endtime.split(':').map(Number);

        const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

        // Calculate number of days per week
        let daysPerWeek = 7;
        if (weekdays) {
          daysPerWeek = this.parseDaysCount(weekdays);
        }

        totalMinutesPerWeek += dailyMinutes * daysPerWeek;
      }
    }

    // Convert to hours per month (4.33 weeks per month on average)
    const hoursPerMonth = (totalMinutesPerWeek / 60) * 4.33;
    return Math.round(hoursPerMonth);
  }

  async forecastSchedule(scheduleName: string, instanceId: string, daysAhead: number = 7): Promise<ScheduleForecast> {
    const schedule = await this.dbRepo.getSchedule(scheduleName);
    if (!schedule) {
      throw new Error(`Schedule '${scheduleName}' not found`);
    }

    const periodNames = schedule.periods;
    const periods: Period[] = [];

    for (const periodName of periodNames) {
      const period = await this.dbRepo.getPeriod(periodName);
      if (period) {
        periods.push(period);
      }
    }

    const events = this.generateScheduleEvents(schedule, periods, daysAhead);

    return {
      instanceId,
      schedule: scheduleName,
      timezone: schedule.timezone || 'UTC',
      nextEvents: events,
    };
  }

  private generateScheduleEvents(schedule: Schedule, periods: Period[], daysAhead: number): ScheduleEvent[] {
    const events: ScheduleEvent[] = [];
    const now = new Date();
    const timezone = schedule.timezone || 'UTC';

    // This is a simplified implementation
    // A full implementation would need to properly parse all period rules
    // and calculate exact start/stop times

    for (const period of periods) {
      if (period.begintime) {
        const [hour, minute] = period.begintime.split(':').map(Number);

        for (let day = 0; day < daysAhead; day++) {
          const eventDate = new Date(now);
          eventDate.setDate(eventDate.getDate() + day);
          eventDate.setHours(hour, minute, 0, 0);

          if (this.isPeriodActiveOnDate(period, eventDate)) {
            events.push({
              action: 'start',
              timestamp: eventDate.toISOString(),
              periodName: period.name,
            });
          }
        }
      }

      if (period.endtime) {
        const [hour, minute] = period.endtime.split(':').map(Number);

        for (let day = 0; day < daysAhead; day++) {
          const eventDate = new Date(now);
          eventDate.setDate(eventDate.getDate() + day);
          eventDate.setHours(hour, minute, 0, 0);

          if (this.isPeriodActiveOnDate(period, eventDate)) {
            events.push({
              action: 'stop',
              timestamp: eventDate.toISOString(),
              periodName: period.name,
            });
          }
        }
      }
    }

    // Sort by timestamp
    return events.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private isPeriodActiveOnDate(period: Period, date: Date): boolean {
    // Check weekday
    if (period.weekdays) {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      if (!this.isDayInRange(dayOfWeek, period.weekdays)) {
        return false;
      }
    }

    // Check month
    if (period.months) {
      const month = date.getMonth(); // 0 = January, 11 = December
      if (!this.isMonthInRange(month, period.months)) {
        return false;
      }
    }

    // Check monthday
    if (period.monthdays) {
      const dayOfMonth = date.getDate();
      if (!this.isDayOfMonthInRange(dayOfMonth, period.monthdays)) {
        return false;
      }
    }

    return true;
  }

  private parseDaysCount(weekdays: string): number {
    // Simple parser for weekday ranges
    // Format can be: "Mon-Fri", "Mon,Wed,Fri", "Mon-Fri,Sun", etc.
    const dayMap: Record<string, number> = {
      'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
    };

    const days = new Set<number>();

    const parts = weekdays.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        // Range
        const [start, end] = part.split('-');
        const startDay = dayMap[start.trim()];
        const endDay = dayMap[end.trim()];
        for (let i = startDay; i <= endDay; i++) {
          days.add(i);
        }
      } else {
        // Single day
        const day = dayMap[part.trim()];
        if (day !== undefined) {
          days.add(day);
        }
      }
    }

    return days.size;
  }

  private isDayInRange(dayOfWeek: number, weekdays: string): boolean {
    // Simplified check - a full implementation would properly parse the weekdays string
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekdays.includes(dayNames[dayOfWeek]);
  }

  private isMonthInRange(month: number, months: string): boolean {
    // Simplified check - a full implementation would properly parse the months string
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.includes(monthNames[month]);
  }

  private isDayOfMonthInRange(dayOfMonth: number, monthdays: string): boolean {
    // Simplified check - a full implementation would properly parse ranges like "1-15"
    return monthdays.includes(dayOfMonth.toString());
  }
}
