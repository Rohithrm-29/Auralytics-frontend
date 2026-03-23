import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare, Target,
  TrendingUp, ClipboardList, LogOut, Sun, Moon, Menu, X,
  Sparkles, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../store/auth';
import { useTheme } from '../../store/theme';
import { Avatar } from '../ui';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils';
import type { Role } from '../../types';
import NotificationBell from './NotificationBell';

interface NavItem { to: string; icon: React.ReactNode; label: string; roles: Role[]; }

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',    icon: <LayoutDashboard size={16} />, label: 'Dashboard',   roles: ['hr','manager','recruiter'] },
  { to: '/employees',    icon: <Users size={16} />,           label: 'Employees',   roles: ['hr','manager','senior_designer','recruiter','designer'] },
  { to: '/projects',     icon: <FolderKanban size={16} />,    label: 'Projects',    roles: ['hr','manager','senior_designer','designer','recruiter'] },
  { to: '/tasks',        icon: <CheckSquare size={16} />,     label: 'Tasks',       roles: ['hr','manager','senior_designer','designer','recruiter'] },
  { to: '/kra',          icon: <Target size={16} />,          label: 'KRA',         roles: ['hr','manager','senior_designer','designer','recruiter'] },
  { to: '/revenue',      icon: <TrendingUp size={16} />,      label: 'Revenue',     roles: ['hr','manager'] },
  { to: '/audit',        icon: <ClipboardList size={16} />,   label: 'Audit Logs',  roles: ['hr','manager'] },
];

export default function Sidebar() {
  const { employee, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = employee?.role as Role;
  const visibleItems = NAV_ITEMS.filter(i => i.roles.includes(role));

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow-brand">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-gray-100 text-sm tracking-wide">AURALYTICS</div>
            <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Workforce Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sidebar-scroll">
        <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2">Navigation</div>
        {visibleItems.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
            onClick={() => setMobileOpen(false)}>
            {item.icon}
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/[0.06] pt-3">
        {/* User */}
        <NavLink to="/profile/me"
          className={({ isActive }) => clsx('nav-item', isActive && 'active')}
          onClick={() => setMobileOpen(false)}>
          <Avatar name={employee?.name || ''} url={employee?.avatar_url} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-200 truncate">{employee?.name}</div>
            <div className="text-[10px] text-gray-500">{ROLE_LABELS[role]}</div>
          </div>
        </NavLink>

        <div className="flex items-center gap-1 px-1">
          <button onClick={toggle} className="btn-ghost flex-1 justify-center py-2">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={handleLogout} className="btn-ghost flex-1 justify-center py-2 text-rose-400 hover:text-rose-300">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-surface-800 border-r border-white/[0.06] h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface-800 border-b border-white/[0.06] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="font-display font-bold text-sm text-gray-100">AURALYTICS</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2">
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-800 border-r border-white/[0.06] animate-slide-right">
            <div className="flex items-center justify-end p-4 border-b border-white/[0.06]">
              <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1.5">
                <X size={16} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
