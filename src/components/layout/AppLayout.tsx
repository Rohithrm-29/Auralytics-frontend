import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop topbar */}
        <header className="hidden lg:flex items-center justify-end h-14 px-6 border-b border-white/[0.06] bg-surface-800/50 backdrop-blur-sm flex-shrink-0">
          <NotificationBell />
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
