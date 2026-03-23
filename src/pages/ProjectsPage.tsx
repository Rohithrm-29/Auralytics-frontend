import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, FolderKanban, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectService, employeeService } from '../services';
import {
  PageHeader, Badge, Modal, ConfirmModal, SearchInput,
  EmptyState, Skeleton, Spinner, StatCard,
} from '../components/ui';
import { PROJECT_STATUS_STYLES, fmtCurrency, fmtDate } from '../utils';
import { useAuth } from '../store/auth';
import type { Project, ProjectStatus } from '../types';

const schema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  budget:      z.coerce.number().positive(),
  status:      z.enum(['active', 'completed', 'on_hold']),
});
type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS: ProjectStatus[] = ['active', 'completed', 'on_hold'];
const STATUS_LABELS: Record<ProjectStatus, string> = { active: 'Active', completed: 'Completed', on_hold: 'On Hold' };

export default function ProjectsPage() {
  const { employee: me } = useAuth();
  const qc = useQueryClient();
  const isHR = me?.role === 'hr';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [assignModal, setAssignModal] = useState<Project | null>(null);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: () => isHR
      ? projectService.list({ page, limit: 9, search: search || undefined })
      : projectService.my(),
  });

  const projects: Project[] = isHR
    ? (data?.data?.data || [])
    : (data?.data?.data || []).map((a: any) => a.project).filter(Boolean);
  const pagination = data?.data?.pagination;

  const { data: empData } = useQuery({
    queryKey: ['employees', 'all-light'],
    queryFn: () => employeeService.list({ limit: 100 }),
  });
  const allEmployees = empData?.data?.data || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  });

  const createMut = useMutation({
    mutationFn: (d: FormData) => projectService.create(d),
    onSuccess: () => { toast.success('Project created'); qc.invalidateQueries({ queryKey: ['projects'] }); closeForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: (d: FormData) => projectService.update(editing!.id, d),
    onSuccess: () => { toast.success('Project updated'); qc.invalidateQueries({ queryKey: ['projects'] }); closeForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: () => projectService.delete(deleting!.id),
    onSuccess: () => { toast.success('Project deleted'); qc.invalidateQueries({ queryKey: ['projects'] }); setDeleting(null); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const assignMut = useMutation({
    mutationFn: () => projectService.assign(assignModal!.id, selectedEmps),
    onSuccess: () => { toast.success('Employees assigned'); qc.invalidateQueries({ queryKey: ['projects'] }); setAssignModal(null); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const openCreate = () => { reset({ status: 'active', budget: 0 }); setEditing(null); setShowForm(true); };
  const openEdit = (p: Project) => { setEditing(p); reset({ name: p.name, description: p.description, budget: p.budget, status: p.status }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); reset(); };
  const onSubmit = (d: FormData) => editing ? updateMut.mutate(d) : createMut.mutate(d);

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const activeCount = projects.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Projects"
        subtitle={isHR ? `${pagination?.total || projects.length} total projects` : 'Your assigned projects'}
        actions={isHR && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} /> New Project
          </button>
        )}
      />

      {/* Mini stats */}
      {isHR && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Projects" value={pagination?.total || projects.length} icon={<FolderKanban size={18} />} color="brand" />
          <StatCard label="Active" value={activeCount} icon={<FolderKanban size={18} />} color="emerald" />
          <StatCard label="Total Budget" value={fmtCurrency(totalBudget)} icon={<DollarSign size={18} />} color="amber" />
        </div>
      )}

      {isHR && (
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search projects…" className="w-64" />
      )}

      {/* Project grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState icon={<FolderKanban size={22} />} title="No projects found"
          description={isHR ? "Create your first project to get started" : "You haven't been assigned to any projects yet"}
          action={isHR ? <button onClick={openCreate} className="btn-primary"><Plus size={14} />New Project</button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="card p-5 flex flex-col gap-3 hover:border-white/10 transition-all group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <FolderKanban size={18} className="text-brand-400" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isHR && (
                    <>
                      <button onClick={() => { setAssignModal(project); setSelectedEmps([]); }}
                        className="btn-ghost p-1.5 text-gray-500"><Users size={13} /></button>
                      <button onClick={() => openEdit(project)} className="btn-ghost p-1.5 text-gray-500"><Pencil size={13} /></button>
                      <button onClick={() => setDeleting(project)} className="btn-ghost p-1.5 text-rose-500"><Trash2 size={13} /></button>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-200 text-sm">{project.name}</h3>
                {project.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>}
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/[0.04]">
                <Badge className={PROJECT_STATUS_STYLES[project.status]} dot>
                  {STATUS_LABELS[project.status]}
                </Badge>
                <span className="text-xs font-mono text-gray-400">{fmtCurrency(project.budget)}</span>
              </div>
              <div className="text-[10px] text-gray-600">Created {fmtDate(project.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
          <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Project Name</label>
            <input {...register('name')} className="input" placeholder="Brand Refresh 2025" />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} className="input min-h-[72px] resize-none" placeholder="Brief description…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Budget (SGD)</label>
              <input {...register('budget')} type="number" className="input" placeholder="150000" />
              {errors.budget && <p className="text-xs text-rose-400 mt-1">{errors.budget.message}</p>}
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting && <Spinner size="sm" />}
              {editing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Employees Modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign to: ${assignModal?.name}`}>
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Select employees to assign to this project.</p>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {allEmployees.map((emp: any) => (
              <label key={emp.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <input type="checkbox" checked={selectedEmps.includes(emp.id)}
                  onChange={e => setSelectedEmps(prev => e.target.checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id))}
                  className="accent-brand-500" />
                <span className="text-sm text-gray-300">{emp.name}</span>
                <span className="text-xs text-gray-600 ml-auto">{emp.role}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setAssignModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => assignMut.mutate()} disabled={selectedEmps.length === 0 || assignMut.isPending} className="btn-primary">
              {assignMut.isPending && <Spinner size="sm" />}
              Assign {selectedEmps.length > 0 ? `(${selectedEmps.length})` : ''}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMut.mutate()}
        title="Delete Project" message={`Delete "${deleting?.name}"? All associated data will be removed.`}
        loading={deleteMut.isPending} />
    </div>
  );
}
