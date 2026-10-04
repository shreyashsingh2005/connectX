'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Password reset link sent!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-bg-primary border border-border-subtle rounded-[10px] h-[40px] pl-[36px] pr-[12px] text-text-main text-[13px] placeholder-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all";

  return (
    <div className="min-h-[100dvh] w-full bg-bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-bg-surface rounded-[24px] p-[32px] md:p-[40px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-none border border-border-subtle relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-[56px] h-[56px] bg-brand text-white rounded-[16px] flex items-center justify-center mb-6 shadow-md">
            <ConnectXLogo size={32} />
          </div>
          <h1 className="text-[28px] font-[700] text-text-main leading-[34px] tracking-tight mb-2 text-center">
            Reset Password
          </h1>
          <p className="text-[14px] text-text-sec text-center">
            Enter your email to receive a reset link.
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-[500] text-text-main">Email address</label>
              <div className="relative">
                <Mail className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-[40px] bg-brand text-white text-[13px] font-[600] rounded-[10px] hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50">
              {loading ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : null}
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div className="text-center p-6 bg-brand-soft rounded-[12px] mb-4">
            <h3 className="text-[14px] font-[600] text-brand mb-2">Check your email</h3>
            <p className="text-[13px] text-brand/80">We sent a password reset link to <br/><span className="font-semibold">{email}</span></p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link href="/login" className="flex items-center gap-2 text-[13px] font-[500] text-text-sec hover:text-text-main transition-colors">
            <ArrowLeft className="w-[16px] h-[16px]" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
