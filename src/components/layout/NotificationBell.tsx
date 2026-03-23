import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Briefcase, Target, CheckSquare, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services';
import { fmtRelative } from '../../utils';
import type { Notification } from '../../types';
import clsx from 'clsx';

const TYPE_ICONS = {
  task:    <CheckSquare size={13} className="text-blue-400" />,
  kra:     <Target size={13} className="text-violet-400" />,
  project: <Briefcase size={13} className="text-cyan-400" />,
  system:  <Info size={13} className="text-gray-400" />,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: notificationService.unreadCount,
    refetchInterval: 30_000,
  });

  const { data: notifsData } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationService.list({ limit: 15 }),
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifications: Notification[] = notifsData?.data?.data || [];
  const unread = countData?.count || 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface-700 border border-white/10 rounded-xl shadow-2xl z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-sm font-semibold text-gray-200">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                All caught up!
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                  className={clsx(
                    'flex gap-3 px-4 py-3 border-b border-white/[0.04] cursor-pointer transition-colors',
                    n.read ? 'opacity-50' : 'hover:bg-white/[0.03]'
                  )}
                >
                  <div className="w-6 h-6 rounded-lg bg-surface-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{fmtRelative(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
