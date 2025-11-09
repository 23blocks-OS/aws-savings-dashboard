import axios from 'axios';
import type {
  Schedule,
  Period,
  Config,
  Instance,
  DashboardStats,
  AnalyticsSummary,
  SavingsCalculation,
  ListResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Schedules API
export const schedulesApi = {
  list: () => api.get<ListResponse<Schedule>>('/schedules'),
  get: (name: string) => api.get<Schedule>(`/schedules/${name}`),
  create: (data: Partial<Schedule>) => api.post<Schedule>('/schedules', data),
  update: (name: string, data: Partial<Schedule>) => api.put<Schedule>(`/schedules/${name}`, data),
  delete: (name: string) => api.delete(`/schedules/${name}`),
  forecast: (name: string, days?: number) => api.get(`/schedules/${name}/forecast`, { params: { days } }),
};

// Periods API
export const periodsApi = {
  list: () => api.get<ListResponse<Period>>('/periods'),
  get: (name: string) => api.get<Period>(`/periods/${name}`),
  create: (data: Partial<Period>) => api.post<Period>('/periods', data),
  update: (name: string, data: Partial<Period>) => api.put<Period>(`/periods/${name}`, data),
  delete: (name: string) => api.delete(`/periods/${name}`),
};

// Config API
export const configApi = {
  get: () => api.get<Config>('/config'),
  update: (data: Partial<Config>) => api.put<Config>('/config', data),
};

// Instances API
export const instancesApi = {
  list: (params?: { service?: string; region?: string; schedule?: string; state?: string }) =>
    api.get<ListResponse<Instance>>('/instances', { params }),
  get: (id: string) => api.get<Instance>(`/instances/${id}`),
};

// Analytics API
export const analyticsApi = {
  dashboard: () => api.get<DashboardStats>('/analytics/dashboard'),
  savings: () => api.get<AnalyticsSummary>('/analytics/savings'),
  scheduleSavings: (name: string) => api.get(`/analytics/schedules/${name}/savings`),
  instanceSavings: (id: string) => api.get<SavingsCalculation>(`/analytics/instances/${id}/savings`),
};

export default api;
