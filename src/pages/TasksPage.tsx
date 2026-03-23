import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Pencil, CheckSquare, MessageSquare, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskService, employeeService, projectService } from '../services';
import {
  PageHeader, Badge, Modal, ConfirmModal, SearchInput,
  EmptyState, Skeleton, Avatar, Spinner,
} from '../components/ui';
import {
  TASK_STATUS_STYLES, TASK_STATUS_LABELS,
  PRIORITY_STYLES, fmtDate, fmtRelative,
} from '../utils';
import { useAuth } from '../store/auth';
import type { Task, TaskStatus, TaskPriority } from '../types';

const schema = z.object({
  title:       z.string().min(2),
  description: z.string().optional(),
  assigned_to: z.string().uuid('Select an assignee'),
  status:      z.enum(['todo', 'in_progress', 'review', 'done']),
  priority:    z.enum(['low', 'medium', 'high']),
  due_date:    z.string().optional(),
  project_id:  z.string().uuid().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export default function TasksPage() {
  const { employee: me } = useAuth();
  const qc = useQueryClient();
  const canAssign = ['hr', 'manager'].includes(me?.role || '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, search, statusFilter, priorityFilter],
    queryFn: () => taskService.list({
      page, limit: 12, search: search || undefined,
      status: statusFilter || undefined, priority: priorityFilter || undefined,
    }),
  });

  const tasks: Task[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const { data: empData } = useQuery({ queryKey: ['employees', 'all-light'], queryFn: () => employeeService.list({ limit: 100 }) });
  const allEmployees = empData?.data?.data || [];

  const { data: projData } = useQuery({ queryKey: ['projects', 'all-light'], queryFn: () => projectService.list({ limit: 100 }) });
  const allProjects = projData?.data?.data || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'todo', priority: 'medium' },
  });

  const createMut = useMutation({
    mutationFn: (d: FormData) => taskService.create({ ...d, project_id: d.project_id || undefined }),
    onSuccess: () => { toast.success('Task created'); qc.invalidateQueries({ queryKey: ['tasks'] }); closeForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: (d: FormData) => taskService.update(editing!.id, d),
    onSuccess: () => { toast.success('Task updated'); qc.invalidateQueries({ queryKey: ['tasks'] }); closeForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => taskService.update(id, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });

  const deleteMut = useMutation({
    mutationFn: () => taskService.delete(deleting!.id),
    onSuccess: () => { toast.success('Task deleted'); qc.invalidateQueries({ queryKey: ['tasks'] }); setDeleting(null); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed'),
  });

  const commentMut = useMutation({
    mutationFn: () => taskService.addComment(commentTask!.id, comment),
    onSuccess: () => { toast.success('Comment added'); setComment(''); setCommentTask(null); },
  });

  const openCreate = () => { reset({ status: 'todo', priority: 'medium' }); setEditing(null); setShowForm(true); };
  const openEdit = (t: Task) => {
    setEditing(t);
    reset({ title: t.title, description: t.description, assigned_to: t.assigned_to, status: t.status, priority: t.priority, due_date: t.due_date?.slice(0, 16) || '', project_id: t.project_id || '' });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); reset(); };
  const onSubmit = (d: FormData) => editing ? updateMut.mutate(d) : createMut.mutate(d);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Tasks"
        subtitle={`${pagination?.total || tasks.length} tasks`}
        actions={canAssign && <button onClick={openCreate} className="btn-primary"><Plus size={15} />New Task</button>}
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tasks…" className="w-56" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-40 h-9 py-1.5">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} className="input w-36 h-9 py-1.5">
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : tasks.length === 0 ? (
          <EmptyState icon={<CheckSquare size={22} />} title="No tasks found" description="Adjust filters or create a new task"
            action={canAssign ? <button onClick={openCreate} className="btn-primary"><Plus size={14} />New Task</button> : undefined} />
        ) : tasks.map(task => (
          <div key={task.id} className="card p-4 flex items-start gap-4 hover:border-white/10 transition-all group">
            {/* Status toggle */}
            <button
              onClick={() => {
                const next: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'review', review: 'done', done: 'todo' };
                statusMut.mutate({ id: task.id, status: next[task.status] });
              }}
              className="mt-0.5 flex-shrink-0"
              title="Cycle status"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? 'border-emerald-500 bg-emerald-500/20' : 'border-gray-600 hover:border-brand-400'}`}>
                {task.status === 'done' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {task.title}
                </span>
                <Badge className={PRIORITY_STYLES[task.priority]}>{task.priority}</Badge>
                <Badge className={TASK_STATUS_STYLES[task.status]}>{TASK_STATUS_LABELS[task.status]}</Badge>
              </div>
              {task.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {task.assignee && (
                  <div className="flex items-center gap-1.5">
                    <Avatar name={task.assignee.name} size="xs" />
                    <span className="text-xs text-gray-500">{task.assignee.name}</span>
                  </div>
                )}
                {task.project && (
                  <span className="text-xs text-gray-600 bg-surface-500 px-2 py-0.5 rounded-full">{task.project.name}</span>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock size={10} />
                    <span>{fmtDate(task.due_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => setCommentTask(task)} className="btn-ghost p-1.5 text-gray-500">
                <MessageSquare size={13} />
              </button>
              {canAssign && (
                <>
                  <button onClick={() => openEdit(task)} className="btn-ghost p-1.5 text-gray-500"><Pencil size={13} /></button>
                  <button onClick={() => setDeleting(task)} className="btn-ghost p-1.5 text-rose-500"><Trash2 size={13} /></button>
                </>
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

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Task' : 'New Task'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input {...register('title')} className="input" placeholder="Task title…" />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} className="input min-h-[60px] resize-none" placeholder="Details…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assign To</label>
              <select {...register('assigned_to')} className="input">
                <option value="">Select employee…</option>
                {allEmployees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              {errors.assigned_to && <p className="text-xs text-rose-400 mt-1">{errors.assigned_to.message}</p>}
            </div>
            <div>
              <label className="label">Project</label>
              <select {...register('project_id')} className="input">
                <option value="">None</option>
                {allProjects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                {STATUSES.map(s => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input {...register('due_date')} type="datetime-local" className="input" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting && <Spinner size="sm" />}
              {editing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Comment Modal */}
      <Modal open={!!commentTask} onClose={() => { setCommentTask(null); setComment(''); }} title="Add Comment">
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium">{commentTask?.title}</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="input min-h-[80px] resize-none"
            placeholder="Write a comment…"
          />
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setCommentTask(null); setComment(''); }} className="btn-secondary">Cancel</button>
            <button onClick={() => commentMut.mutate()} disabled={!comment.trim() || commentMut.isPending} className="btn-primary">
              {commentMut.isPending && <Spinner size="sm" />}
              Post Comment
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMut.mutate()}
        title="Delete Task" message={`Delete "${deleting?.title}"?`} loading={deleteMut.isPending} />
    </div>
  );
}
