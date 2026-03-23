import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Employee } from '../types';

interface AuthContextValue {
  employee: Employee | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (employee: Employee, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(() => {
    try {
      const s = localStorage.getItem('employee');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('accessToken')
  );

  const login = useCallback((emp: Employee, at: string, rt: string) => {
    setEmployee(emp);
    setAccessToken(at);
    localStorage.setItem('employee', JSON.stringify(emp));
    localStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
  }, []);

  const logout = useCallback(() => {
    setEmployee(null);
    setAccessToken(null);
    localStorage.removeItem('employee');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  return (
    <AuthContext.Provider value={{
      employee,
      accessToken,
      isAuthenticated: !!employee && !!accessToken,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
