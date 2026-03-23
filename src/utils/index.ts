import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import type { Role, TaskStatus, TaskPriority, KraStatus, ProjectStatus } from '../types';

// Date formatting
export const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const parsed = parseISO(d);
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy') : '—';
};

export const fmtDateTime = (d?: string | null) => {
  if (!d) return '—';
  const parsed = parseISO(d);
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy, HH:mm') : '—';
};

export const fmtRelative = (d?: string | null) => {
  if (!d) return '—';
  const parsed = parseISO(d);
  return isValid(parsed) ? formatDistanceToNow(parsed, { addSuffix: true }) : '—';
};

// Currency
export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n);

// Role labels
export const ROLE_LABELS: Record<Role, string> = {
  hr:              'HR',
  manager:         'Manager',
  recruiter:       'Recruiter',
  senior_designer: 'Senior Designer',
  designer:        'Designer',
};

export const ROLE_COLORS: Record<Role, string> = {
  hr:              'bg-violet-500/15 text-violet-400',
  manager:         'bg-cyan-500/15 text-cyan-400',
  recruiter:       'bg-amber-500/15 text-amber-400',
  senior_designer: 'bg-emerald-500/15 text-emerald-400',
  designer:        'bg-blue-500/15 text-blue-400',
};

// Status styles
export const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  todo:        'bg-surface-400 text-gray-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
  review:      'bg-amber-500/15 text-amber-400',
  done:        'bg-emerald-500/15 text-emerald-400',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
};

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low:    'bg-surface-400 text-gray-500',
  medium: 'bg-amber-500/10 text-amber-400',
  high:   'bg-rose-500/10 text-rose-400',
};

export const KRA_STATUS_STYLES: Record<KraStatus, string> = {
  pending:   'bg-surface-400 text-gray-400',
  submitted: 'bg-blue-500/15 text-blue-400',
  approved:  'bg-emerald-500/15 text-emerald-400',
  rejected:  'bg-rose-500/15 text-rose-400',
};

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  active:    'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-brand-500/15 text-brand-400',
  on_hold:   'bg-amber-500/15 text-amber-400',
};

// Initials avatar
export const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

// Avatar color from name (deterministic)
const AVATAR_COLORS = ['#6366f1','#22d3ee','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#84cc16'];
export const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// Debounce
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Month name
export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const fmtMonth = (m: number) => MONTH_NAMES[m - 1] || String(m);
