import React from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils';
import clsx from 'clsx';

// ── Avatar ────────────────────────────────────────────────────
interface AvatarProps { name: string; url?: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string; }
export function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  if (url) return (
    <img src={url} alt={name} className={clsx('rounded-full object-cover', sizes[size], className)} />
  );
  return (
    <div className={clsx('rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0', sizes[size], className)}
      style={{ backgroundColor: getAvatarColor(name) }}>
      {getInitials(name)}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; className?: string; dot?: boolean; }
export function Badge({ children, className, dot }: BadgeProps) {
  return (
    <span className={clsx('badge', className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />}
      {children}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
  return <Loader2 className={clsx('animate-spin text-brand-400', sizes[size], className)} />;
}

// ── Modal ─────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string; }
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full bg-surface-700 border border-white/10 rounded-2xl shadow-2xl animate-slide-up', maxWidth)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="font-display text-base font-semibold text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────
interface ConfirmProps { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; loading?: boolean; }
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="space-y-4">
        <div className="flex gap-3">
          <AlertCircle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-gray-400">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger">
            {loading ? <Spinner size="sm" /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Empty State ───────────────────────────────────────────────
interface EmptyProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="w-14 h-14 rounded-2xl bg-surface-500 flex items-center justify-center text-gray-500 mb-4">{icon}</div>}
      <h3 className="text-sm font-medium text-gray-300 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-500 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ value, color = 'brand', size = 'md' }: { value: number; color?: string; size?: 'sm' | 'md'; }) {
  const heights = { sm: 'h-1', md: 'h-2' };
  const colors: Record<string, string> = {
    brand: 'bg-brand-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500',
  };
  return (
    <div className={clsx('w-full rounded-full bg-surface-400', heights[size])}>
      <div className={clsx('rounded-full transition-all duration-500', heights[size], colors[color] || 'bg-brand-500')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; actions?: React.ReactNode; }
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Stats Card ────────────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; icon: React.ReactNode; change?: string; changeType?: 'up' | 'down' | 'neutral'; color?: string; }
export function StatCard({ label, value, icon, change, changeType = 'neutral', color = 'brand' }: StatCardProps) {
  const iconBg: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    violet: 'bg-violet-500/10 text-violet-400',
  };
  const changeColors = { up: 'text-emerald-400', down: 'text-rose-400', neutral: 'text-gray-500' };

  return (
    <div className="stat-card group hover:border-white/10 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconBg[color] || iconBg.brand)}>
          {icon}
        </div>
        {change && <span className={clsx('text-xs font-medium', changeColors[changeType])}>{change}</span>}
      </div>
      <div>
        <div className="text-2xl font-display font-semibold text-gray-100">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ── Search Input ──────────────────────────────────────────────
import { Search } from 'lucide-react';
interface SearchInputProps { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; }
export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <div className={clsx('relative', className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-8 py-2 h-9 text-sm w-full" />
    </div>
  );
}
