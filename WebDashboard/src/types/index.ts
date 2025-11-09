// Shared types matching the backend
export interface Schedule {
  type: 'schedule';
  name: string;
  periods: string[];
  timezone?: string;
  override_status?: 'running' | 'stopped';
  enforced?: boolean;
  retain_running?: boolean;
  hibernate?: boolean;
  ssm_maintenance_window?: string;
  description?: string;
}

export interface Period {
  type: 'period';
  name: string;
  begintime?: string;
  endtime?: string;
  weekdays?: string;
  monthdays?: string;
  months?: string;
  description?: string;
}

export interface Config {
  type: 'config';
  name: string;
  scheduled_services?: string[];
  tagname?: string;
  default_timezone?: string;
  regions?: string[];
}

export interface Instance {
  id: string;
  name?: string;
  type: string;
  service: 'ec2' | 'rds';
  state: string;
  schedule?: string;
  account: string;
  region: string;
  instanceType?: string;
  engine?: string;
  tags?: Record<string, string>;
}

export interface DashboardStats {
  totalInstances: number;
  runningInstances: number;
  stoppedInstances: number;
  scheduledInstances: number;
  activeSchedules: number;
  activePeriods: number;
  estimatedMonthlySavings: number;
  upcomingEvents: ScheduleEvent[];
}

export interface ScheduleEvent {
  action: 'start' | 'stop';
  timestamp: string;
  periodName: string;
}

export interface SavingsCalculation {
  instanceId: string;
  instanceType: string;
  region: string;
  service: 'ec2' | 'rds';
  hoursPerMonth: number;
  hoursSaved: number;
  hourlyRate: number;
  monthlyCost: number;
  monthlySavings: number;
  yearlySavings: number;
}

export interface AnalyticsSummary {
  totalInstances: number;
  managedInstances: number;
  activeSchedules: number;
  totalMonthlySavings: number;
  totalYearlySavings: number;
  savingsByAccount: Record<string, number>;
  savingsByRegion: Record<string, number>;
  savingsByService: Record<string, number>;
}

export interface ListResponse<T> {
  items: T[];
  count: number;
}
