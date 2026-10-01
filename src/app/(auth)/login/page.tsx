'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';

import { Suspense } from 'react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/chat';
  const supabase = createClient();

  async function handleResendVerification() {
    if (resendCooldown > 0 || resending || !email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      toast.success('Verification email resent! Please check your inbox.');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('rate limit') || error?.status === 429) {
        toast.error('Too many verification emails were requested. Please wait a while before trying again.');
        setResendCooldown(60);
      } else {
        toast.error(msg || 'Failed to resend verification email.');
      }
    } finally {
      setResending(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      toast.success('Welcome back!');
      router.push(redirectTo);
      router.refresh();
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('not confirmed') || msg.toLowerCase().includes('email is not verified')) {
        setNeedsVerification(true);
        toast.error('Please verify your email address before signing in.');
      } else if (msg.includes('rate limit') || error?.status === 429) {
        toast.error('Login attempts are temporarily rate-limited. Please try again later.');
      } else {
        toast.error(msg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Google login failed';
      toast.error(message);
    }
  }

  const inputClass = "w-full bg-white dark:bg-[#11141A] border border-gray-200 dark:border-[#252A34] rounded-[10px] h-[44px] pl-10 pr-4 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all";

  return (
    <div className="w-full max-w-[400px] relative z-10">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <ConnectXLogo size={48} />
        </div>
        <h1 className="text-[26px] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Welcome back</h1>
        <p className="text-[14px] text-gray-600 dark:text-gray-400">Sign in to continue to <span className="font-semibold text-[#8B5CF6]">connectX</span></p>
      </div>

      <div className="bg-white dark:bg-[#11141A] rounded-2xl border border-gray-200 dark:border-[#252A34] p-6 shadow-sm">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[14px] font-medium text-gray-700 dark:text-gray-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-medium text-gray-700 dark:text-gray-300">Password</label>
              <Link href="/forgot-password" className="text-[14px] text-[#8B5CF6] hover:text-[#7C3AED] transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#8B5CF6] text-white text-[14px] font-medium rounded-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          {needsVerification && (
            <div className="mt-4 p-4 bg-white dark:bg-[#0B0D12] border border-gray-200 dark:border-[#252A34] rounded-[10px] flex flex-col items-center justify-center space-y-3">
              <p className="text-[14px] text-gray-600 dark:text-gray-400 text-center">
                Your email is not verified yet.
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending || resendCooldown > 0}
                className="text-[14px] h-[40px] font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 px-4 rounded-[10px] transition-colors disabled:opacity-50 disabled:pointer-events-none w-full border border-[#8B5CF6]/20 flex items-center justify-center"
              >
                {resending ? 'Sending...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
            </div>
          )}
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-[#252A34]" />
          </div>
          <div className="relative flex justify-center text-[14px]">
            <span className="px-4 bg-white dark:bg-[#11141A] text-gray-500">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full h-[44px] bg-white dark:bg-[#11141A] border border-gray-200 dark:border-[#252A34] text-[14px] text-gray-700 dark:text-gray-300 rounded-[10px] font-medium hover:bg-gray-50 dark:hover:bg-[#1A1D24] transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <p className="text-center text-[14px] text-gray-600 dark:text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#8B5CF6] hover:text-[#7C3AED] font-medium transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0D12] flex items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]"/></div>}>
      <LoginContent />
    </Suspense>
  );
}
