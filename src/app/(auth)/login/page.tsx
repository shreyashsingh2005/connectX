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
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/chat';
  const supabase = createClient();

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

  const inputClass = "w-full bg-white dark:bg-[#151922] border border-gray-200 dark:border-[#252A34] rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-[#F5F7FA] placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all";

  return (
    <div className="w-full max-w-md relative z-10 animate-slide-in-right">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <ConnectXLogo size={56} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Welcome back</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Sign in to continue to <span className="font-semibold text-[#8B5CF6]">connectX</span></p>
      </div>

      <div className="bg-white dark:bg-[#11141A] rounded-2xl border border-gray-200 dark:border-[#252A34] p-8 shadow-sm">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
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
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#8B5CF6] hover:text-[#7C3AED] transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8B5CF6] text-white font-semibold py-3.5 rounded-xl hover:opacity-90  transition-all flex items-center justify-center gap-2 mt-6 shadow-sm shadow-[#8B5CF6]/10 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {needsVerification && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-xl flex flex-col items-center justify-center space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                Your email is not verified yet.
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending || resendCooldown > 0}
                className="text-sm font-medium text-yellow-900 dark:text-yellow-100 bg-yellow-100 dark:bg-yellow-800/40 px-4 py-2 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800/60 transition-colors disabled:opacity-50 disabled:pointer-events-none w-full"
              >
                {resending ? 'Sending...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
            </div>
          )}
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-50 dark:bg-[#111827] text-gray-500 font-medium">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-gray-100 dark:bg-[#11141A]/80 border border-white/10 text-gray-900 dark:text-white py-3.5 rounded-xl font-medium hover:bg-gray-200 dark:bg-[#151922] hover:border-white/20 transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#8B5CF6] hover:text-[#7C3AED] font-semibold transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F19] flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Premium Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full hidden" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full hidden" />
      </div>
      <Suspense fallback={<div className="text-[#8B5CF6] animate-pulse">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}


