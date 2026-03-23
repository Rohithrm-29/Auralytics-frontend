import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Eye, EyeOff, LogIn, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services';
import { useAuth } from '../store/auth';
import { Spinner } from '../components/ui';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.login(data.email, data.password);
      const { employee, tokens } = res.data.data;
      await login(employee, tokens.accessToken, tokens.refreshToken);
      toast.success(`Welcome back, ${employee.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Invalid credentials';
      toast.error(msg);
      console.log(err)
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow-brand mb-4">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-100 tracking-tight">Auralytics</h1>
          <p className="text-sm text-gray-500 mt-1">Workforce Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="card p-8 bg-surface-700 border-white/10">
          <h2 className="font-display text-lg font-semibold text-gray-200 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@auralytics.io"
                  className="input pl-9"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {isSubmitting ? <Spinner size="sm" /> : <LogIn size={15} />}
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-3 rounded-lg bg-surface-600 border border-white/[0.06]">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="space-y-1">
              {[
                ['HR', 'sarah.chen@auralytics.io'],
                ['Manager', 'marcus.tan@auralytics.io'],
                ['Designer', 'aisha.malik@auralytics.io'],
              ].map(([role, email]) => (
                <div key={email} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{role}</span>
                  <code className="font-mono text-gray-400">{email}</code>
                </div>
              ))}
              <p className="text-[11px] text-gray-600 mt-1.5">Password: <code className="font-mono">Password123!</code></p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          © 2025 Auralytics · Enterprise Workforce Intelligence
        </p>
      </div>
    </div>
  );
}
