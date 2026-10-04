'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, Shield, MessageCircle, Video, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
import { cn } from '@/lib/utils';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
    setAuthError(null);
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
      setResendCooldown(60);
    } catch (error: any) {
      const msg = error?.message || 'Failed to resend email';
      setAuthError(msg);
    } finally {
      setResending(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) return;
    
    setLoading(true);
    setAuthError(null);
    setNeedsVerification(false);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      router.push(redirectTo);
      router.refresh();
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('not confirmed') || msg.toLowerCase().includes('email is not verified')) {
        setNeedsVerification(true);
        setAuthError('Please verify your email address before signing in.');
      } else if (msg.includes('rate limit') || error?.status === 429) {
        setAuthError('Too many attempts. Please wait a moment and try again.');
      } else {
        setAuthError('Unable to sign in. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  }

    async function handleGoogleLogin() {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        },
      });
      if (error) throw error;
      // redirecting to google...
    } catch (error: any) {
      setGoogleLoading(false);
      const msg = error?.message?.toLowerCase() || '';
      if (msg.includes('cancel') || msg.includes('user closed')) {
        setAuthError('Google sign-in was cancelled.');
      } else {
        setAuthError('Google sign-in failed. Please try again.');
      }
    }
  }

  const inputClass = "w-full bg-white dark:bg-[#0B0D12] border border-gray-200 dark:border-[#252A34] rounded-[14px] h-[48px] pl-10 pr-4 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#8B5CF6]/50 focus:ring-[3px] focus:ring-[#8B5CF6]/15 transition-all duration-200";

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center h-full">
      <div className="text-left mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '100ms' }}>
        <h2 className="text-[28px] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Welcome back</h2>
        <p className="text-[15px] text-gray-500 dark:text-gray-400">Sign in to continue to connectX</p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '200ms' }}>
        {authError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[14px] flex items-start gap-3 text-red-600 dark:text-red-400 text-[14px] animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{authError}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2 group">
            <label className="text-[14px] font-medium text-gray-700 dark:text-gray-300 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#8B5CF6] transition-colors" />
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

          <div className="space-y-2 group">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[14px] font-medium text-gray-700 dark:text-gray-300">Password</label>
              <Link href="/forgot-password" className="text-[13px] text-[#8B5CF6] hover:text-[#7C3AED] transition-colors font-medium rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#8B5CF6] transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-[15px] font-semibold rounded-[14px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#8B5CF6]/40"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          {needsVerification && (
            <div className="mt-4 p-4 bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] rounded-[14px] flex flex-col items-center justify-center space-y-3 animate-in fade-in slide-in-from-top-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending || resendCooldown > 0}
                className="text-[14px] h-[40px] font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 px-4 rounded-[10px] transition-colors disabled:opacity-50 disabled:pointer-events-none w-full border border-[#8B5CF6]/20 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
              >
                {resending ? 'Sending...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
            </div>
          )}
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-[#252A34]" />
          </div>
          <div className="relative flex justify-center text-[13px]">
            <span className="px-4 bg-white dark:bg-[#11141A] text-gray-500 dark:text-gray-400 font-medium">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
          className="w-full h-[48px] bg-white dark:bg-[#151922] border border-gray-200 dark:border-[#252A34] text-[15px] text-gray-700 dark:text-gray-200 rounded-[14px] font-medium hover:bg-gray-50 dark:hover:bg-[#1A1F2B] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-200 dark:focus-visible:ring-gray-700"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-[14px] text-gray-500 dark:text-gray-400 mt-8">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#8B5CF6] hover:text-[#7C3AED] font-semibold transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 px-1 py-0.5">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3 text-white/90">
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 flex-shrink-0">
        <Icon className="w-4 h-4 text-[#A78BFA]" />
      </div>
      <span className="text-[15px] font-medium">{text}</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B0D12] flex items-center justify-center p-0 md:p-6 lg:p-8">
      <div className="w-full max-w-[1100px] bg-white dark:bg-[#11141A] md:rounded-[28px] md:shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[100dvh] md:min-h-0 md:h-[680px] page-transition-enter border border-transparent md:border-[#EAECF0] dark:md:border-[#252A34]">
        
        <div className="w-full md:w-[480px] lg:w-[500px] relative bg-[#090A0F] p-8 md:p-12 flex flex-col justify-between overflow-hidden flex-shrink-0 border-b md:border-b-0 md:border-r border-[#252A34]">
          <div className="absolute inset-0 z-0 opacity-60">
            <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[70%] rounded-full bg-[#8B5CF6] mix-blend-screen filter blur-[100px] opacity-30 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#4F46E5] mix-blend-screen filter blur-[120px] opacity-20" />
            <div className="absolute top-[40%] left-[30%] w-[50%] h-[50%] rounded-full bg-[#EC4899] mix-blend-screen filter blur-[100px] opacity-10" />
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          </div>

          <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-6 md:mb-12">
              <ConnectXLogo size={40} className="shadow-lg shadow-[#8B5CF6]/20 rounded-xl" />
              <span className="text-[22px] font-bold text-white tracking-tight">connectX</span>
            </div>
            
            <h1 className="text-[32px] md:text-[40px] font-bold text-white leading-[1.15] tracking-tight mb-4 md:mb-6">
              Secure chats.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] to-[#818CF8]">Real connections.</span>
            </h1>
            
            <div className="hidden md:flex flex-col gap-4 mt-10">
              <FeatureItem icon={Shield} text="End-to-end encrypted chats" />
              <FeatureItem icon={MessageCircle} text="Real-time messaging" />
              <FeatureItem icon={Video} text="Audio & video calls" />
              <FeatureItem icon={ImageIcon} text="Secure photo & file sharing" />
            </div>
          </div>

          <div className="relative z-10 hidden md:block animate-in fade-in duration-700" style={{ animationDelay: '500ms' }}>
            <p className="text-[#98A2B3] text-[14px] font-medium">Everything you need to stay connected.</p>
          </div>
        </div>
        
        <div className="flex-1 bg-white dark:bg-[#11141A] p-6 md:p-12 lg:p-16 flex flex-col justify-center overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]"/></div>}>
            <LoginContent />
          </Suspense>
        </div>

      </div>
    </div>
  );
}
