import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, TrendingUp, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';
import { revenueService, projectService } from '../services';
import {
  PageHeader, Modal, ConfirmModal, EmptyState, Skeleton, Spinner, StatCard,
} from '../components/ui';
import { fmtCurrency, fmtDate, MONTH_NAMES } from '../utils';
import type { Revenue } from '../types';

const schema = z.object({
  project_id: z.string().uuid('Select a project'),
  amount:     z.coerce.number().positive(),
  month:      z.coerce.number().int().min(1).max(12),
  year:       z.coerce.number().int().min(2020).max(2100),
  notes:      z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

export default function RevenuePage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Revenue | null>(null);
  const [yearFilter, setYearFilter] = useState(CURRENT_YEAR);

  const { data, isLoading } = useQuery({
    queryKey: ['revenue', page, yearFilter],
    queryFn: () => revenueService.list({ page, limit: 12, year: yearFilter }),
  });

  const { data: trendsRes } = useQuery({
    queryKey: ['revenue', 'trends', yearFilter],
    queryFn: () => revenueService.trends(yearFilter),
  });

  const { data: bvrRes } = useQuery({
    queryKey: ['revenue', 'bvr'],
    queryFn: revenueService.budgetVsRev,
  });

  const { data: projData } = useQuery({ queryKey: ['projects', 'all-light'], queryFn: () => projectService.list({ limit: 100 }) });
  const allProjects = projData?.data?.data || [];

  const revenues: Revenue[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const trends = trendsRes?.data?.data?.monthly || [];
  const totalRevenue = trendsRes?.data?.data?.total || 0;
  const bvr: any[] = bvrRes?.data?.data || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { month: new Date().getMonth() + 1, year: CURRENT_YEAR },
  });

  const createMut = useMutation({
    mutationFn: (d: FormData) => revenueService.create(d),
    onSuccess: () => { toast.success('Revenue entry added'); qc.invalidateQueries({ queryKey: ['revenue'] }); setShowForm(false); reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: () => revenueService.delete(deleting!.id),
    onSuccess: () => { toast.success('Entry deleted'); qc.invalidateQueries({ queryKey: ['revenue'] }); setDeleting(null); },
  });

  const avgMonthly = trends.length ? totalRevenue / trends.length : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Revenue Management"
        subtitle="Track project revenue and budgets"
        actions={
          <div className="flex items-center gap-3">
            <select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))} className="input h-9 w-28 py-1.5">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => { reset(); setShowForm(true); }} className="btn-primary">
              <Plus size={15} />Add Entry
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={`Total ${yearFilter} Revenue`} value={fmtCurrency(totalRevenue)} icon={<TrendingUp size={18} />} color="emerald" />
        <StatCard label="Monthly Average" value={fmtCurrency(avgMonthly)} icon={<BarChart2 size={18} />} color="cyan" />
        <StatCard label="Total Entries" value={pagination?.total || revenues.length} icon={<TrendingUp size={18} />} color="brand" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Monthly Revenue {yearFilter}</h3>
          {trends.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-gray-600 text-sm">No data for {yearFilter}</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#5c5c7a', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => { const [y, m] = v.split('-'); return MONTH_NAMES[parseInt(m) - 1]; }} />
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fill: '#5c5c7a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                  itemStyle={{ color: '#f1f1f5', fontSize: 12 }}
                  formatter={(v: number) => [fmtCurrency(v), 'Revenue']}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {trends.map((_: any, i: number) => <Cell key={i} fill={i === trends.length - 1 ? '#6366f1' : '#6366f133'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Budget vs Revenue */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Budget vs Revenue</h3>
          {bvr.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-gray-600 text-sm">No project data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bvr.slice(0, 5)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fill: '#5c5c7a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9999b3', fontSize: 10 }} axisLine={false} tickLine={false} width={90}
                  tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v} />
                <Tooltip
                  contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                  itemStyle={{ color: '#f1f1f5', fontSize: 12 }}
                  formatter={(v: number) => fmtCurrency(v)}
                />
                <Bar dataKey="budget" name="Budget" fill="#6366f133" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Revenue table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="section-title">Revenue Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/[0.06]">
              <tr>
                {['Project', 'Period', 'Amount', 'Notes', 'Date Added', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="table-cell"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : revenues.length === 0 ? (
                <tr><td colSpan={6} className="py-10">
                  <EmptyState icon={<TrendingUp size={22} />} title="No revenue entries" />
                </td></tr>
              ) : revenues.map(r => (
                <tr key={r.id} className="table-row group">
                  <td className="table-cell font-medium text-gray-200">{r.project?.name || '—'}</td>
                  <td className="table-cell text-gray-400">{MONTH_NAMES[(r.month || 1) - 1]} {r.year}</td>
                  <td className="table-cell">
                    <span className="font-mono font-semibold text-emerald-400">{fmtCurrency(r.amount)}</span>
                  </td>
                  <td className="table-cell text-gray-500 max-w-[160px] truncate">{r.notes || '—'}</td>
                  <td className="table-cell text-gray-500">{fmtDate(r.created_at)}</td>
                  <td className="table-cell">
                    <button onClick={() => setDeleting(r)}
                      className="btn-ghost p-1.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); }} title="Add Revenue Entry">
        <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Project</label>
            <select {...register('project_id')} className="input">
              <option value="">Select project…</option>
              {allProjects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.project_id && <p className="text-xs text-rose-400 mt-1">{errors.project_id.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Amount (SGD)</label>
              <input {...register('amount')} type="number" className="input" placeholder="50000" />
              {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="label">Month</label>
              <select {...register('month')} className="input">
                {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select {...register('year')} className="input">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input {...register('notes')} className="input" placeholder="e.g. Phase 1 milestone" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting && <Spinner size="sm" />}
              Add Entry
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMut.mutate()}
        title="Delete Revenue Entry" message="Remove this revenue entry?" loading={deleteMut.isPending} />
    </div>
  );
}
