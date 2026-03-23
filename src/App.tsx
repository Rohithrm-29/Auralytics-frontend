import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/auth';
import { ThemeProvider } from './store/theme';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { Spinner } from './components/ui';

// Lazy loaded pages
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const EmployeesPage  = lazy(() => import('./pages/EmployeesPage'));
const ProjectsPage   = lazy(() => import('./pages/ProjectsPage'));
const TasksPage      = lazy(() => import('./pages/TasksPage'));
const KraPage        = lazy(() => import('./pages/KraPage'));
const RevenuePage    = lazy(() => import('./pages/RevenuePage'));
const AuditPage      = lazy(() => import('./pages/AuditPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — wrap all in AppLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Redirect root */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard: hr, manager, recruiter */}
                <Route element={<ProtectedRoute roles={['hr', 'manager', 'recruiter']} />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                {/* Employees: all */}
                <Route path="/employees" element={<EmployeesPage />} />

                {/* Projects: all */}
                <Route path="/projects" element={<ProjectsPage />} />

                {/* Tasks: all */}
                <Route path="/tasks" element={<TasksPage />} />

                {/* KRA: all */}
                <Route path="/kra" element={<KraPage />} />

                {/* Revenue: hr, manager */}
                <Route element={<ProtectedRoute roles={['hr', 'manager']} />}>
                  <Route path="/revenue" element={<RevenuePage />} />
                </Route>

                {/* Audit: hr, manager */}
                <Route element={<ProtectedRoute roles={['hr', 'manager']} />}>
                  <Route path="/audit" element={<AuditPage />} />
                </Route>

                {/* Profile */}
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/profile/me" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
