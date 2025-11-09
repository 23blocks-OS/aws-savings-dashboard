// Core domain types for AWS Instance Scheduler

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
  use_metrics?: boolean;
  stop_new_instances?: boolean;
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
  cross_account_roles?: CrossAccountRole[];
  schedule_clusters?: boolean;
  create_rds_snapshot?: boolean;
  started_tags?: string;
  stopped_tags?: string;
}

export interface CrossAccountRole {
  account: string;
  role: string;
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

export interface ScheduleForecast {
  instanceId: string;
  schedule: string;
  timezone: string;
  nextEvents: ScheduleEvent[];
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

// API Request/Response types
export interface CreateScheduleRequest {
  name: string;
  periods: string[];
  timezone?: string;
  description?: string;
  enforced?: boolean;
  retain_running?: boolean;
  hibernate?: boolean;
  override_status?: 'running' | 'stopped';
  ssm_maintenance_window?: string;
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {}

export interface CreatePeriodRequest {
  name: string;
  begintime?: string;
  endtime?: string;
  weekdays?: string;
  monthdays?: string;
  months?: string;
  description?: string;
}

export interface UpdatePeriodRequest extends Partial<CreatePeriodRequest> {}

export interface UpdateConfigRequest {
  scheduled_services?: string[];
  tagname?: string;
  default_timezone?: string;
  regions?: string[];
  cross_account_roles?: CrossAccountRole[];
  schedule_clusters?: boolean;
  create_rds_snapshot?: boolean;
}

export interface ListResponse<T> {
  items: T[];
  count: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

// Validation schemas using Zod
import { z } from 'zod';

export const ScheduleSchema = z.object({
  name: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/, 'Schedule name can only contain letters, numbers, hyphens, and underscores'),
  periods: z.array(z.string()).min(1, 'At least one period is required'),
  timezone: z.string().optional(),
  description: z.string().max(256).optional(),
  enforced: z.boolean().optional(),
  retain_running: z.boolean().optional(),
  hibernate: z.boolean().optional(),
  override_status: z.enum(['running', 'stopped']).optional(),
  ssm_maintenance_window: z.string().optional(),
});

export const PeriodSchema = z.object({
  name: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/, 'Period name can only contain letters, numbers, hyphens, and underscores'),
  begintime: z.string().regex(/^\d{2}:\d{2}$/, 'Begin time must be in HH:MM format').optional(),
  endtime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format').optional(),
  weekdays: z.string().optional(),
  monthdays: z.string().optional(),
  months: z.string().optional(),
  description: z.string().max(256).optional(),
}).refine(
  (data) => data.begintime || data.endtime || data.weekdays || data.monthdays || data.months,
  { message: 'At least one of begintime, endtime, weekdays, monthdays, or months must be specified' }
);

export const ConfigSchema = z.object({
  scheduled_services: z.array(z.enum(['ec2', 'rds'])).optional(),
  tagname: z.string().optional(),
  default_timezone: z.string().optional(),
  regions: z.array(z.string()).optional(),
  cross_account_roles: z.array(z.object({
    account: z.string(),
    role: z.string(),
  })).optional(),
  schedule_clusters: z.boolean().optional(),
  create_rds_snapshot: z.boolean().optional(),
});
