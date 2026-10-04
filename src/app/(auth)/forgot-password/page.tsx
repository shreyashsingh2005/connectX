'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';

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

  const inputClass = "w-full bg-white dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] rounded-[11px] h-[44px] md:h-[48px] px-4 text-[#17151F] dark:text-[#F5F7FA] text-[15px] placeholder-[#777283] dark:placeholder-[#9A9FAD] focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/10 transition-all duration-150 shadow-sm";

  return (
    <AuthLayout>
      <div className="w-full flex flex-col">
        <Link href="/login" className="w-9 h-9 rounded-full bg-white dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] flex items-center justify-center text-[#777283] dark:text-[#9A9FAD] hover:text-text-main transition-colors mb-6 animate-auth-stagger" style={{ animationDelay: '0ms' }}>
          <ArrowLeft size={18} strokeWidth={2.5} />
        </Link>
        
        <h2 className="text-[28px] md:text-[32px] font-[700] text-text-main leading-tight tracking-[-0.02em] mb-1.5 animate-auth-stagger" style={{ animationDelay: '70ms' }}>
          Reset password
        </h2>
        <p className="text-[14px] md:text-[15px] text-[#777283] dark:text-[#9A9FAD] mb-8 animate-auth-stagger" style={{ animationDelay: '140ms' }}>
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="bg-brand/10 border border-brand/20 p-6 rounded-[12px] text-center space-y-3 animate-auth-stagger" style={{ animationDelay: '200ms' }}>
            <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Mail size={24} strokeWidth={2} />
            </div>
            <h3 className="text-[15px] font-[600] text-text-main">Check your email</h3>
            <p className="text-[14px] text-[#777283] dark:text-[#9A9FAD] leading-relaxed">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
            </p>
            <button onClick={() => setSent(false)} className="text-[13px] font-[600] text-brand hover:text-brand-dark transition-colors pt-2 hover:underline decoration-brand/30 underline-offset-4">
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5 animate-auth-stagger" style={{ animationDelay: '200ms' }}>
              <label className="text-[12px] md:text-[13px] font-[600] text-text-main block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} />
            </div>

            <button type="submit" disabled={loading} className="w-full h-[44px] md:h-[48px] bg-brand text-white text-[14px] md:text-[15px] font-[600] rounded-[11px] shadow-[0_4px_12px_rgba(139,92,246,0.25)] dark:shadow-none hover:bg-brand-dark hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none animate-auth-stagger" style={{ animationDelay: '260ms' }}>
              {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : null}
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center animate-auth-stagger" style={{ animationDelay: '320ms' }}>
          <Link href="/login" className="text-[13px] font-[600] text-[#777283] dark:text-[#9A9FAD] hover:text-text-main transition-colors hover:underline decoration-text-sec/30 underline-offset-4">
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
