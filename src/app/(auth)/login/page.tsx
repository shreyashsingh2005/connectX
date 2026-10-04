'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/chat';
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      router.push(redirectTo);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error?.message || 'Google login failed');
      setGoogleLoading(false);
    }
  }

  const inputClass = "w-full bg-white dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] rounded-[11px] h-[44px] md:h-[48px] px-4 text-[#17151F] dark:text-[#F5F7FA] text-[15px] placeholder-[#777283] dark:placeholder-[#9A9FAD] focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/10 transition-all duration-150 shadow-sm";

  return (
    <div className="w-full flex flex-col">
      <h2 className="text-[28px] md:text-[32px] font-[700] text-text-main leading-tight tracking-[-0.02em] mb-1.5 animate-auth-stagger" style={{ animationDelay: '0ms' }}>
        Welcome back
      </h2>
      <p className="text-[14px] md:text-[15px] text-[#777283] dark:text-[#9A9FAD] mb-8 animate-auth-stagger" style={{ animationDelay: '70ms' }}>
        Sign in to continue to connectX.
      </p>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <div className="space-y-1.5 animate-auth-stagger" style={{ animationDelay: '140ms' }}>
          <label className="text-[12px] md:text-[13px] font-[600] text-text-main block">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} />
        </div>

        <div className="space-y-1.5 animate-auth-stagger" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <label className="text-[12px] md:text-[13px] font-[600] text-text-main">Password</label>
            <Link href="/forgot-password" className="text-[12px] md:text-[13px] font-[600] text-brand hover:text-brand-dark transition-all hover:underline decoration-brand/30 underline-offset-4">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={`${inputClass} pr-[48px]`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-[4px] top-1/2 -translate-y-1/2 w-[36px] h-[36px] md:w-[40px] md:h-[40px] flex items-center justify-center text-[#777283] dark:text-[#9A9FAD] hover:text-text-main hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D2A] rounded-[8px] transition-colors outline-none">
              {showPassword ? <EyeOff className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> : <Eye className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full h-[44px] md:h-[48px] bg-brand text-white text-[14px] md:text-[15px] font-[600] rounded-[11px] shadow-[0_4px_12px_rgba(139,92,246,0.25)] dark:shadow-none hover:bg-brand-dark hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none animate-auth-stagger" style={{ animationDelay: '260ms' }}>
          {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : null}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative w-full my-7 animate-auth-stagger" style={{ animationDelay: '320ms' }}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E7E5EC] dark:border-[#252936]" />
        </div>
        <div className="relative flex justify-center text-[12px] md:text-[13px]">
          <span className="px-4 bg-[#FFFFFF] dark:bg-[#0B0D12] text-[#777283] dark:text-[#9A9FAD] font-[500]">Or continue with</span>
        </div>
      </div>

      <button onClick={handleGoogleLogin} disabled={loading || googleLoading} className="w-full h-[44px] md:h-[48px] bg-white dark:bg-[#141721] border border-[#E7E5EC] dark:border-[#252936] text-[14px] md:text-[15px] font-[600] text-text-main rounded-[11px] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1D2A] transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm animate-auth-stagger" style={{ animationDelay: '380ms' }}>
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>

      <p className="text-center text-[13px] md:text-[14px] text-[#777283] dark:text-[#9A9FAD] mt-8 animate-auth-stagger" style={{ animationDelay: '440ms' }}>
        Don't have an account?{' '}
        <Link href="/register" className="text-brand hover:text-brand-dark font-[600] transition-colors hover:underline decoration-brand/30 underline-offset-4">
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>}>
        <LoginContent />
      </Suspense>
    </AuthLayout>
  );
}
