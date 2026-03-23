import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail, Building, UserCheck, Calendar } from 'lucide-react';
import { employeeService } from '../services';
import {
  Avatar, Badge, Skeleton, PageHeader, ProgressBar,
} from '../components/ui';
import {
  ROLE_LABELS, ROLE_COLORS, fmtDate,
  TASK_STATUS_STYLES, TASK_STATUS_LABELS, KRA_STATUS_STYLES,
} from '../utils';
import { useAuth } from '../store/auth';
import type { Task, Kra } from '../types';

const TSS = TASK_STATUS_STYLES;
const TSL = TASK_STATUS_LABELS;

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { employee: me } = useAuth();
  const profileId = id === 'me' || !id ? me?.id : id;

  const { data, isLoading } = useQuery({
    queryKey: ['employee-profile', profileId],
    queryFn: () => employeeService.profile(profileId!),
    enabled: !!profileId,
  });

  const profile = data?.data?.data;
  const employee = profile?.employee;
  const recentTasks: Task[] = profile?.recentTasks || [];
  const recentKra: Kra[] = profile?.recentKra || [];

  const taskDone = recentTasks.filter(t => t.status === 'done').length;
  const kraApproved = recentKra.filter(k => k.status === 'approved').length;
  const taskScore = recentTasks.length ? Math.round((taskDone / recentTasks.length) * 100) : 0;
  const kraScore = recentKra.length ? Math.round((kraApproved / recentKra.length) * 100) : 0;

  if (isLoading) return (
    <div className="space-y-5">
      <Skeleton className="h-32" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );

  if (!employee) return (
    <div className="text-center py-20 text-gray-500">Employee not found</div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <PageHeader title="Employee Profile" />

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <Avatar name={employee.name} url={employee.avatar_url} size="lg" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-gray-100">{employee.name}</h2>
                <Badge className={`${ROLE_COLORS[employee.role]} mt-1`}>{ROLE_LABELS[employee.role]}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={13} className="text-gray-600" />
                <span className="truncate">{employee.email}</span>
              </div>
              {employee.department && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Building size={13} className="text-gray-600" />
                  <span>{employee.department}</span>
                </div>
              )}
              {employee.manager && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <UserCheck size={13} className="text-gray-600" />
                  <span>{employee.manager.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar size={13} className="text-gray-600" />
                <span>Joined {fmtDate(employee.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Task Completion</h3>
            <span className="text-2xl font-display font-bold text-gray-100">{taskScore}%</span>
          </div>
          <ProgressBar value={taskScore} color={taskScore >= 70 ? 'emerald' : taskScore >= 40 ? 'amber' : 'rose'} />
          <p className="text-xs text-gray-500 mt-2">{taskDone} of {recentTasks.length} recent tasks completed</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">KRA Achievement</h3>
            <span className="text-2xl font-display font-bold text-gray-100">{kraScore}%</span>
          </div>
          <ProgressBar value={kraScore} color={kraScore >= 70 ? 'emerald' : kraScore >= 40 ? 'amber' : 'rose'} />
          <p className="text-xs text-gray-500 mt-2">{kraApproved} of {recentKra.length} KRAs approved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recent Tasks */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Recent Tasks</h3>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">No tasks assigned</p>
          ) : (
            <div className="space-y-2.5">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    task.status === 'done' ? 'bg-emerald-400' :
                    task.status === 'in_progress' ? 'bg-blue-400' :
                    task.status === 'review' ? 'bg-amber-400' : 'bg-gray-600'
                  }`} />
                  <span className={`text-xs flex-1 truncate ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                    {task.title}
                  </span>
                  <Badge className={`${TSS[task.status]} text-[10px] px-1.5`}>{TSL[task.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent KRA */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Recent KRAs</h3>
          {recentKra.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">No KRAs assigned</p>
          ) : (
            <div className="space-y-2.5">
              {recentKra.map(kra => (
                <div key={kra.id} className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    kra.status === 'approved' ? 'bg-emerald-400' :
                    kra.status === 'rejected' ? 'bg-rose-400' :
                    kra.status === 'submitted' ? 'bg-blue-400' : 'bg-gray-600'
                  }`} />
                  <span className="text-xs flex-1 truncate text-gray-300">{kra.title}</span>
                  <Badge className={`${KRA_STATUS_STYLES[kra.status]} text-[10px] px-1.5`}>
                    {kra.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
