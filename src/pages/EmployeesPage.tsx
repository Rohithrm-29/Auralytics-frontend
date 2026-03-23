import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeService } from '../services';
import {
  PageHeader, Avatar, Badge, Modal, ConfirmModal,
  Skeleton, SearchInput, EmptyState, Spinner,
} from '../components/ui';
import { ROLE_LABELS, ROLE_COLORS, fmtDate } from '../utils';
import { useAuth } from '../store/auth';
import type { Employee, Role } from '../types';

const ROLES: Role[] = ['hr', 'manager', 'recruiter', 'senior_designer', 'designer'];

const schema = z.object({
  name:       z.string().min(2),
  email:      z.string().email(),
  password:   z.string().min(8).optional().or(z.literal('')),
  role:       z.enum(['hr', 'manager', 'recruiter', 'senior_designer', 'designer']),
  manager_id: z.string().uuid().optional().nullable().or(z.literal('')),
  department: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function EmployeesPage() {
  const { employee: me } = useAuth();
  const qc = useQueryClient();
  const isHR = me?.role === 'hr';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, roleFilter],
    queryFn: () => employeeService.list({ page, limit: 12, search: search || undefined, role: roleFilter || undefined }),
  });

  const employees: Employee[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const { data: allEmpData } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => employeeService.list({ limit: 100 }),
    enabled: isHR,
  });
  const allEmployees: Employee[] = allEmpData?.data?.data || [];

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (d: FormData) => employeeService.create({ ...d, password: d.password || 'Password123!' }),
    onSuccess: () => { toast.success('Employee created'); qc.invalidateQueries({ queryKey: ['employees'] }); closeForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to create'),
  });

  const updateMut = useMutation({
    mutationFn: (d: FormData) => employeeService.update(editing!.id, d),
    onSuccess: () => { toast.success('Employee updated'); qc.invalidateQueries({ queryKey: ['employees'] }); closeForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: () => employeeService.delete(deleting!.id),
    onSuccess: () => { toast.success('Employee removed'); qc.invalidateQueries({ queryKey: ['employees'] }); setDeleting(null); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to delete'),
  });

  const openCreate = () => { reset({ role: 'designer' }); setEditing(null); setShowForm(true); };
  const openEdit = (emp: Employee) => {
    setEditing(emp);
    reset({ name: emp.name, email: emp.email, role: emp.role, manager_id: emp.manager_id || '', department: emp.department || '' });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); reset(); };
  const onSubmit = (d: FormData) => { editing ? updateMut.mutate(d) : createMut.mutate(d); };

  const watchRole = watch('role');

  const TOP_LEVEL: Role[] = ['hr', 'manager'];
  const needsManager = watchRole && !TOP_LEVEL.includes(watchRole);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Employees"
        subtitle={`${pagination?.total || 0} team members`}
        actions={isHR && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} /> Add Employee
          </button>
        )}
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search employees…" className="w-56" />
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="input w-44 py-2 h-9"
        >
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/[0.06]">
              <tr>
                {['Employee', 'Role', 'Department', 'Manager', 'Joined', isHR ? 'Actions' : ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="table-cell"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} className="py-12">
                  <EmptyState icon={<Users size={22} />} title="No employees found" description="Try adjusting your filters" />
                </td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={emp.name} url={emp.avatar_url} size="sm" />
                      <div>
                        <div className="text-sm font-medium text-gray-200">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <Badge className={ROLE_COLORS[emp.role as Role]}>{ROLE_LABELS[emp.role as Role]}</Badge>
                  </td>
                  <td className="table-cell text-gray-500">{emp.department || '—'}</td>
                  <td className="table-cell text-gray-500">
                    {emp.manager ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={emp.manager.name} size="xs" />
                        <span className="text-xs">{emp.manager.name}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="table-cell text-gray-500">{fmtDate(emp.created_at)}</td>
                  {isHR && (
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(emp)} className="btn-ghost p-1.5 text-gray-500">
                          <Pencil size={13} />
                        </button>
                        {emp.id !== me?.id && (
                          <button onClick={() => setDeleting(emp)} className="btn-ghost p-1.5 text-rose-500">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register('name')} className="input" placeholder="John Doe" />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="john@company.io" />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {!editing && (
            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className="input" placeholder="Min 8 chars" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select {...register('role')} className="input">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input {...register('department')} className="input" placeholder="e.g. Design" />
            </div>
          </div>

          {needsManager && (
            <div>
              <label className="label">Manager</label>
              <select {...register('manager_id')} className="input">
                <option value="">Select manager…</option>
                {allEmployees
                  .filter(e => ['hr', 'manager', 'senior_designer'].includes(e.role) && e.id !== editing?.id)
                  .map(e => <option key={e.id} value={e.id}>{e.name} ({ROLE_LABELS[e.role as Role]})</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <Spinner size="sm" /> : null}
              {editing ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMut.mutate()}
        title="Remove Employee"
        message={`Are you sure you want to remove ${deleting?.name}? This action cannot be undone.`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
