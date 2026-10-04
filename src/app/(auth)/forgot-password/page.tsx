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

  const inputClass = "w-full bg-[#FAFAFC] dark:bg-[#11131A] border border-[#E6E4EC] dark:border-[#2A2E3B] rounded-[10px] h-[44px] px-[14px] text-text-main text-[14px] placeholder-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all";

  return (
    <AuthLayout>
      <div className="w-full flex flex-col">
        <Link href="/login" className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-sec hover:text-text-main transition-colors mb-6">
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        
        <h2 className="text-[30px] md:text-[32px] font-[700] text-text-main leading-tight tracking-tight mb-2">
          Reset your password
        </h2>
        <p className="text-[14px] text-text-sec mb-8">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="bg-brand-soft border border-brand/20 p-6 rounded-[12px] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2">
              <Mail size={24} strokeWidth={2} />
            </div>
            <h3 className="text-[15px] font-[600] text-text-main">Check your email</h3>
            <p className="text-[14px] text-text-sec leading-relaxed">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
            </p>
            <button onClick={() => setSent(false)} className="text-[13px] font-[600] text-brand hover:text-brand-dark transition-colors pt-2">
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-[600] text-text-main block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} />
            </div>

            <button type="submit" disabled={loading} className="w-full h-[44px] bg-[#8B5CF6] text-white text-[14px] font-[600] rounded-[10px] hover:bg-[#7C3AED] transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
              {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : null}
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className="text-[13px] font-[600] text-text-sec hover:text-text-main transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
