import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  roles?: Role[];
}

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, employee } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && employee && !roles.includes(employee.role as Role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
