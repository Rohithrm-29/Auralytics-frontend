import api from './api';
import type { Employee, Project, Task, Kra, Revenue, Notification, AuditLog, ApiResponse } from '../types';

// ── Helpers ──────────────────────────────────────────────────
const d = <T>(res: { data: ApiResponse<T> }) => res.data.data as T;

// ── Auth ─────────────────────────────────────────────────────
export const authService = {
  login:   (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string)            => api.post('/auth/refresh', { refreshToken }),
  me:      ()                                => api.get('/auth/me').then(r => d<Employee>(r)),
};

// ── Employees ────────────────────────────────────────────────
export const employeeService = {
  list:           (params?: Record<string, unknown>) => api.get('/employees', { params }),
  get:            (id: string)                       => api.get(`/employees/${id}`).then(r => d<Employee>(r)),
  profile:        (id: string)                       => api.get(`/employees/${id}/profile`),
  myProfile:      ()                                 => api.get('/employees/profile/me'),
  subordinates:   (id: string)                       => api.get(`/employees/${id}/subordinates`).then(r => d<Employee[]>(r)),
  create:         (data: Partial<Employee> & { password: string }) => api.post('/employees', data),
  update:         (id: string, data: Partial<Employee>)            => api.patch(`/employees/${id}`, data),
  delete:         (id: string)                       => api.delete(`/employees/${id}`),
};

// ── Projects ─────────────────────────────────────────────────
export const projectService = {
  list:           (params?: Record<string, unknown>) => api.get('/projects', { params }),
  get:            (id: string)                       => api.get(`/projects/${id}`),
  my:             ()                                 => api.get('/projects/my'),
  create:         (data: Partial<Project>)           => api.post('/projects', data),
  update:         (id: string, data: Partial<Project>) => api.patch(`/projects/${id}`, data),
  delete:         (id: string)                       => api.delete(`/projects/${id}`),
  assign:         (id: string, employee_ids: string[]) => api.post(`/projects/${id}/assign`, { employee_ids }),
  removeEmployee: (id: string, empId: string)        => api.delete(`/projects/${id}/assign/${empId}`),
};

// ── Tasks ────────────────────────────────────────────────────
export const taskService = {
  list:       (params?: Record<string, unknown>) => api.get('/tasks', { params }),
  get:        (id: string)                       => api.get(`/tasks/${id}`),
  stats:      (params?: Record<string, unknown>) => api.get('/tasks/stats', { params }),
  create:     (data: Partial<Task>)              => api.post('/tasks', data),
  update:     (id: string, data: Partial<Task>)  => api.patch(`/tasks/${id}`, data),
  delete:     (id: string)                       => api.delete(`/tasks/${id}`),
  addComment: (id: string, content: string)      => api.post(`/tasks/${id}/comments`, { content }),
};

// ── KRA ──────────────────────────────────────────────────────
export const kraService = {
  list:         (params?: Record<string, unknown>) => api.get('/kra', { params }),
  get:          (id: string)                       => api.get(`/kra/${id}`),
  stats:        (params?: Record<string, unknown>) => api.get('/kra/stats', { params }),
  create:       (data: Partial<Kra>)               => api.post('/kra', data),
  updateStatus: (id: string, status: string)       => api.patch(`/kra/${id}/status`, { status }),
  delete:       (id: string)                       => api.delete(`/kra/${id}`),
};

// ── Revenue ──────────────────────────────────────────────────
export const revenueService = {
  list:           (params?: Record<string, unknown>) => api.get('/revenue', { params }),
  trends:         (year?: number)                    => api.get('/revenue/trends', { params: { year } }),
  budgetVsRev:    ()                                 => api.get('/revenue/budget-vs-revenue'),
  create:         (data: Partial<Revenue>)           => api.post('/revenue', data),
  update:         (id: string, data: Partial<Revenue>) => api.patch(`/revenue/${id}`, data),
  delete:         (id: string)                       => api.delete(`/revenue/${id}`),
};

// ── Notifications ────────────────────────────────────────────
export const notificationService = {
  list:          (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  unreadCount:   ()                                 => api.get('/notifications/unread-count').then(r => d<{ count: number }>(r)),
  markRead:      (id: string)                       => api.patch(`/notifications/${id}/read`),
  markAllRead:   ()                                 => api.patch('/notifications/mark-all-read'),
};

// ── Audit ────────────────────────────────────────────────────
export const auditService = {
  list: (params?: Record<string, unknown>) => api.get('/audit', { params }),
};

// ── Dashboard ────────────────────────────────────────────────
export const dashboardService = {
  stats:       () => api.get('/dashboard/stats'),
  activity:    (limit = 10) => api.get('/dashboard/activity', { params: { limit } }),
  performance: () => api.get('/dashboard/performance'),
};
