export type Role = 'hr' | 'manager' | 'recruiter' | 'senior_designer' | 'designer';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type KraStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  manager_id: string | null;
  department?: string;
  avatar_url?: string;
  created_at: string;
  manager?: { id: string; name: string; role: Role };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  budget: number;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  creator?: { id: string; name: string };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  project_id?: string;
  created_at: string;
  assignee?: { id: string; name: string; role: Role; avatar_url?: string };
  assigner?: { id: string; name: string };
  project?: { id: string; name: string };
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { id: string; name: string; avatar_url?: string };
}

export interface Kra {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  status: KraStatus;
  assigned_by: string;
  target_date?: string;
  created_at: string;
  employee?: { id: string; name: string; role: Role };
  assigner?: { id: string; name: string };
}

export interface Revenue {
  id: string;
  project_id: string;
  amount: number;
  month: number;
  year: number;
  notes?: string;
  created_at: string;
  project?: { id: string; name: string; budget: number };
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'task' | 'kra' | 'project' | 'system';
  entity_id?: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  actor?: { id: string; name: string; role: Role };
}

export interface DashboardStats {
  employees: { total: number; by_role: Record<string, number> };
  projects: { total: number; active: number; completed: number; on_hold: number };
  tasks: { total: number; todo: number; in_progress: number; review: number; done: number; completion_rate: number };
  kra: { total: number; approved: number; achievement_rate: number };
  revenue: { total: number };
}

export interface PerformanceEmployee {
  id: string;
  name: string;
  role: Role;
  department?: string;
  task_completion: number;
  kra_achievement: number;
  total_tasks: number;
  total_kra: number;
  performance_score: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code: string };
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

export interface AuthState {
  employee: Employee | null;
  accessToken: string | null;
  refreshToken: string | null;
}
