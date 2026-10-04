'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';

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
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email first');
        } else {
          throw error;
        }
      } else {
        toast.success('Welcome back!');
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
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
      toast.error(error.message || 'Google login failed');
      setGoogleLoading(false);
    }
  }

  const inputClass = "w-full bg-bg-primary border border-border-subtle rounded-[10px] h-[40px] pl-[36px] pr-[12px] text-text-main text-[13px] placeholder-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all";

  return (
    <div className="w-full max-w-[360px] mx-auto flex flex-col items-center">
      <div className="w-[56px] h-[56px] bg-brand text-white rounded-[16px] flex items-center justify-center mb-6 shadow-md">
        <ConnectXLogo size={32} />
      </div>
      
      <h1 className="text-[28px] font-[700] text-text-main leading-[34px] tracking-tight mb-2 text-center">
        Welcome back
      </h1>
      <p className="text-[14px] text-text-sec text-center mb-8">
        Please enter your details to sign in.
      </p>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-[500] text-text-main">Email</label>
          <div className="relative">
            <Mail className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-[500] text-text-main">Password</label>
            <Link href="/forgot-password" className="text-[12px] font-[500] text-brand hover:text-brand-dark transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={`${inputClass} pr-[40px]`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[8px] top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-sec transition-colors"
            >
              {showPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[40px] bg-brand text-white text-[13px] font-[600] rounded-[10px] hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : null}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative w-full my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-subtle" />
        </div>
        <div className="relative flex justify-center text-[12px]">
          <span className="px-3 bg-bg-surface text-text-muted font-[500]">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        className="w-full h-[40px] bg-bg-surface border border-border-subtle text-[13px] font-[600] text-text-main rounded-[10px] hover:bg-bg-secondary transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>

      <p className="text-center text-[13px] text-text-sec mt-6">
        Don't have an account?{' '}
        <Link href="/register" className="text-brand hover:text-brand-dark font-[600] transition-colors">
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-bg-primary flex flex-col items-center justify-center p-4">
      {/* Soft lavender background blob for light mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden dark:block">
         {/* We can leave dark mode blank or with subtle glow */}
      </div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none dark:hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-brand-soft rounded-full blur-[100px] opacity-70" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#F3F0FF] rounded-full blur-[100px] opacity-70" />
      </div>

      <div className="w-full max-w-[440px] bg-bg-surface rounded-[24px] p-[32px] md:p-[40px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-none border border-border-subtle relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand"/></div>}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
