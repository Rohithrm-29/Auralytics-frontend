import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, CheckCircle, XCircle, Target, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { kraService, employeeService } from '../services';
import {
  PageHeader, Badge, Modal, ConfirmModal, SearchInput,
  EmptyState, Skeleton, Avatar, Spinner, StatCard, ProgressBar,
} from '../components/ui';
import { KRA_STATUS_STYLES, fmtDate, ROLE_LABELS } from '../utils';
import { useAuth } from '../store/auth';
import type { Kra, KraStatus, Role } from '../types';

const schema = z.object({
  employee_id:  z.string().uuid('Select an employee'),
  title:        z.string().min(2),
  description:  z.string().optional(),
  target_date:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS: KraStatus[] = ['pending', 'submitted', 'approved', 'rejected'];
const STATUS_LABELS: Record<KraStatus, string> = { pending: 'Pending', submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected' };

export default function KraPage() {
  const { employee: me } = useAuth();
  const qc = useQueryClient();
  const canManage = ['hr', 'manager'].includes(me?.role || '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Kra | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['kra', page, search, statusFilter],
    queryFn: () => kraService.list({
      page, limit: 12, search: search || undefined,
      status: statusFilter || undefined,
      employee_id: canManage ? undefined : me?.id,
    }),
  });

  const { data: statsRes } = useQuery({
    queryKey: ['kra', 'stats'],
    queryFn: () => kraService.stats(),
  });

  const kras: Kra[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const stats = statsRes?.data?.data;

  const { data: empData } = useQuery({ queryKey: ['employees', 'all-light'], queryFn: () => employeeService.list({ limit: 100 }), enabled: canManage });
  const allEmployees = empData?.data?.data || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMut = useMutation({
    mutationFn: (d: FormData) => kraService.create(d),
    onSuccess: () => { toast.success('KRA assigned'); qc.invalidateQueries({ queryKey: ['kra'] }); setShowForm(false); reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => kraService.updateStatus(id, status),
    onSuccess: () => { toast.success('KRA status updated'); qc.invalidateQueries({ queryKey: ['kra'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: () => kraService.delete(deleting!.id),
    onSuccess: () => { toast.success('KRA deleted'); qc.invalidateQueries({ queryKey: ['kra'] }); setDeleting(null); },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="KRA"
        subtitle="Key Result Areas"
        actions={canManage && <button onClick={() => { reset(); setShowForm(true); }} className="btn-primary"><Plus size={15} />Assign KRA</button>}
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total KRAs" value={stats.total} icon={<Target size={18} />} color="brand" />
          <StatCard label="Approved" value={stats.approved} icon={<CheckCircle size={18} />} color="emerald" />
          <StatCard label="Pending Review" value={stats.submitted} icon={<Target size={18} />} color="amber" />
          <StatCard label="Achievement Rate" value={`${stats.achievement_rate}%`} icon={<Target size={18} />} color="violet" />
        </div>
      )}

      {/* Achievement bar */}
      {stats && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Overall KRA Achievement</span>
            <span className="text-sm font-mono font-semibold text-gray-200">{stats.achievement_rate}%</span>
          </div>
          <ProgressBar value={stats.achievement_rate} color={stats.achievement_rate >= 70 ? 'emerald' : stats.achievement_rate >= 40 ? 'amber' : 'rose'} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search KRAs…" className="w-56" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-40 h-9 py-1.5">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* KRA list */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : kras.length === 0 ? (
          <EmptyState icon={<Target size={22} />} title="No KRAs found" />
        ) : kras.map(kra => (
          <div key={kra.id} className="card p-4 flex items-start gap-4 group hover:border-white/10 transition-all">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Target size={16} className="text-violet-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-200">{kra.title}</span>
                <Badge className={KRA_STATUS_STYLES[kra.status]} dot>{STATUS_LABELS[kra.status]}</Badge>
              </div>
              {kra.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{kra.description}</p>}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {kra.employee && (
                  <div className="flex items-center gap-1.5">
                    <Avatar name={kra.employee.name} size="xs" />
                    <span className="text-xs text-gray-500">{kra.employee.name}</span>
                  </div>
                )}
                {kra.target_date && (
                  <span className="text-xs text-gray-600">Target: {fmtDate(kra.target_date)}</span>
                )}
                {kra.assigner && (
                  <span className="text-xs text-gray-600">by {kra.assigner.name}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Non-manager: submit */}
              {!canManage && kra.employee_id === me?.id && kra.status === 'pending' && (
                <button
                  onClick={() => statusMut.mutate({ id: kra.id, status: 'submitted' })}
                  className="btn-secondary py-1 px-2.5 text-xs"
                  disabled={statusMut.isPending}
                >
                  Submit
                </button>
              )}
              {/* Manager: approve/reject submitted */}
              {canManage && kra.status === 'submitted' && (
                <>
                  <button onClick={() => statusMut.mutate({ id: kra.id, status: 'approved' })}
                    className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Approve">
                    <CheckCircle size={15} />
                  </button>
                  <button onClick={() => statusMut.mutate({ id: kra.id, status: 'rejected' })}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors" title="Reject">
                    <XCircle size={15} />
                  </button>
                </>
              )}
              {canManage && (
                <button onClick={() => setDeleting(kra)} className="btn-ghost p-1.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
          <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); }} title="Assign KRA">
        <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Employee</label>
            <select {...register('employee_id')} className="input">
              <option value="">Select employee…</option>
              {allEmployees.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({ROLE_LABELS[e.role as Role] || e.role})</option>)}
            </select>
            {errors.employee_id && <p className="text-xs text-rose-400 mt-1">{errors.employee_id.message}</p>}
          </div>
          <div>
            <label className="label">KRA Title</label>
            <input {...register('title')} className="input" placeholder="e.g. Q1 Hiring Targets" />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} className="input min-h-[60px] resize-none" placeholder="Details and expectations…" />
          </div>
          <div>
            <label className="label">Target Date</label>
            <input {...register('target_date')} type="datetime-local" className="input" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting && <Spinner size="sm" />}
              Assign KRA
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMut.mutate()}
        title="Delete KRA" message={`Delete "${deleting?.title}"?`} loading={deleteMut.isPending} />
    </div>
  );
}
