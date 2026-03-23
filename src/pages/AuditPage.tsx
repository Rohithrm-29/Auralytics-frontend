import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Shield } from 'lucide-react';
import { auditService } from '../services';
import {
  PageHeader, SearchInput, EmptyState, Skeleton, Avatar, Badge,
} from '../components/ui';
import { fmtDateTime, ROLE_LABELS } from '../utils';
import type { AuditLog, Role } from '../types';

const ENTITY_COLORS: Record<string, string> = {
  employees: 'bg-brand-500/15 text-brand-400',
  projects:  'bg-cyan-500/15 text-cyan-400',
  tasks:     'bg-emerald-500/15 text-emerald-400',
  kra:       'bg-violet-500/15 text-violet-400',
  revenue:   'bg-amber-500/15 text-amber-400',
  auth:      'bg-rose-500/15 text-rose-400',
};

const ACTION_FRIENDLY: Record<string, string> = {
  LOGIN:           'Signed in',
  CREATE_EMPLOYEE: 'Created employee',
  UPDATE_EMPLOYEE: 'Updated employee',
  DELETE_EMPLOYEE: 'Deleted employee',
  CREATE_PROJECT:  'Created project',
  UPDATE_PROJECT:  'Updated project',
  DELETE_PROJECT:  'Deleted project',
  ASSIGN_PROJECT:  'Assigned project',
  CREATE_TASK:     'Created task',
  UPDATE_TASK:     'Updated task',
  DELETE_TASK:     'Deleted task',
  CREATE_KRA:      'Assigned KRA',
  KRA_APPROVED:    'Approved KRA',
  KRA_REJECTED:    'Rejected KRA',
  CREATE_REVENUE:  'Added revenue',
};

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, entityFilter],
    queryFn: () => auditService.list({ page, limit: 20, entity: entityFilter || undefined }),
  });

  const logs: AuditLog[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const filtered = search
    ? logs.filter(l =>
        l.actor?.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Audit Logs"
        subtitle="Complete activity trail for compliance and security"
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search actor or action…" className="w-64" />
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }} className="input w-40 h-9 py-1.5">
          <option value="">All entities</option>
          {['employees', 'projects', 'tasks', 'kra', 'revenue', 'auth'].map(e => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/[0.06]">
              <tr>
                {['Actor', 'Action', 'Entity', 'Timestamp'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="table-cell"><Skeleton className="h-4 w-28" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-12">
                  <EmptyState icon={<ClipboardList size={22} />} title="No audit logs found" />
                </td></tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={log.actor?.name || 'System'} size="xs" />
                      <div>
                        <div className="text-sm text-gray-300">{log.actor?.name || 'System'}</div>
                        {log.actor?.role && (
                          <div className="text-[10px] text-gray-600">{ROLE_LABELS[log.actor.role]}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="text-gray-600" />
                      <span className="text-gray-300">{ACTION_FRIENDLY[log.action] || log.action.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <Badge className={ENTITY_COLORS[log.entity] || 'bg-surface-400 text-gray-500'}>
                      {log.entity}
                    </Badge>
                  </td>
                  <td className="table-cell text-gray-500 font-mono text-xs">{fmtDateTime(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-gray-500">
              Showing {filtered.length} of {pagination.total} entries
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
