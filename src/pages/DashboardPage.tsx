import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, FolderKanban, CheckSquare, Target,
  TrendingUp, Activity, Award, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { dashboardService, revenueService } from '../services';
import {
  StatCard, SkeletonCard, PageHeader, ProgressBar, Avatar, Badge,
} from '../components/ui';
import { fmtCurrency, fmtRelative, ROLE_LABELS, fmtMonth } from '../utils';
import type { DashboardStats, PerformanceEmployee, Role } from '../types';

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#f43f5e'];

export default function DashboardPage() {
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.stats,
  });

  const { data: activityRes } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => dashboardService.activity(8),
  });

  const { data: perfRes } = useQuery({
    queryKey: ['dashboard', 'performance'],
    queryFn: dashboardService.performance,
  });

  const { data: trendsRes } = useQuery({
    queryKey: ['revenue', 'trends'],
    queryFn: () => revenueService.trends(),
  });

  const stats: DashboardStats | null = statsRes?.data?.data || null;
  const activity: any[] = activityRes?.data?.data || [];
  const performance: PerformanceEmployee[] = (perfRes?.data?.data || []).slice(0, 6);
  const trends: { period: string; amount: number }[] = trendsRes?.data?.data?.monthly || [];

  const taskPie = stats ? [
    { name: 'To Do', value: stats.tasks.todo },
    { name: 'In Progress', value: stats.tasks.in_progress },
    { name: 'Review', value: stats.tasks.review },
    { name: 'Done', value: stats.tasks.done },
  ] : [];

  const rolePie = stats
    ? Object.entries(stats.employees.by_role).map(([role, count]) => ({
      name: ROLE_LABELS[role as Role] || role, value: count,
    }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Employees" value={stats?.employees.total || 0}
              icon={<Users size={18} />} color="brand" />
            <StatCard label="Active Projects" value={stats?.projects.active || 0}
              icon={<FolderKanban size={18} />} color="cyan" />
            <StatCard label="Tasks Completed" value={`${stats?.tasks.completion_rate || 0}%`}
              icon={<CheckSquare size={18} />} color="emerald" />
            <StatCard label="Total Revenue" value={fmtCurrency(stats?.revenue.total || 0)}
              icon={<TrendingUp size={18} />} color="amber" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Revenue Trend</h3>
          {trends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No revenue data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="period" tick={{ fill: '#5c5c7a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#5c5c7a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                  labelStyle={{ color: '#9999b3', fontSize: 12 }}
                  itemStyle={{ color: '#f1f1f5', fontSize: 12 }}
                  formatter={(v: number) => [fmtCurrency(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Task breakdown */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Task Status</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={taskPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                paddingAngle={3} dataKey="value">
                {taskPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#f1f1f5' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {taskPie.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-500">{item.name}</span>
                </div>
                <span className="font-mono text-gray-400">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance matrix */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-amber-400" />
            <h3 className="section-title">Performance Matrix</h3>
          </div>
          <div className="space-y-3">
            {performance.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">No data available</p>
            ) : performance.map(emp => (
              <div key={emp.id} className="flex items-center gap-3">
                <Avatar name={emp.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-300 truncate">{emp.name}</span>
                    <span className="text-xs font-mono text-gray-500">{emp.performance_score}%</span>
                  </div>
                  <ProgressBar
                    value={emp.performance_score}
                    color={emp.performance_score >= 70 ? 'emerald' : emp.performance_score >= 40 ? 'amber' : 'rose'}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-cyan-400" />
            <h3 className="section-title">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">No recent activity</p>
            ) : activity.map(log => (
              <div key={log.id} className="flex gap-3 items-start">
                <Avatar name={log.actor?.name || 'System'} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300">
                    <span className="font-medium">{log.actor?.name}</span>
                    {' '}<span className="text-gray-500">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{fmtRelative(log.timestamp)}</p>
                </div>
                <Badge className="bg-surface-500 text-gray-500 text-[10px]">{log.entity}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KRA + Employees by role */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-violet-400" />
            <h3 className="section-title">KRA Achievement</h3>
          </div>
          <div className="text-4xl font-display font-bold text-gray-100 mb-1">
            {stats?.kra.achievement_rate || 0}%
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {stats?.kra.approved || 0} of {stats?.kra.total || 0} KRAs approved
          </p>
          <ProgressBar value={stats?.kra.achievement_rate || 0} color="violet" />
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Team Composition</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={rolePie} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 70 }}>
              <XAxis type="number" tick={{ fill: '#5c5c7a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9999b3', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#f1f1f5' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {rolePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
