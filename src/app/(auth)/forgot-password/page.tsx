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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-white dark:bg-[#11141A] border border-gray-200 dark:border-[#252A34] rounded-[10px] h-[44px] pl-10 pr-4 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0D12] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <ConnectXLogo size={48} />
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Recovery</h1>
          <p className="text-[14px] text-gray-600 dark:text-gray-400">Securely reset your password</p>
        </div>

        <div className="bg-white dark:bg-[#11141A] rounded-2xl border border-gray-200 dark:border-[#252A34] p-6 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[#8B5CF6]" />
              </div>
              <h2 className="text-[20px] font-semibold text-gray-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                We&apos;ve sent a password reset link to <strong className="text-gray-900 dark:text-white">{email}</strong>.
                Please check your spam folder if you don&apos;t see it.
              </p>
              <Link href="/login" className="text-[14px] text-[#8B5CF6] hover:text-[#7C3AED] font-medium transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[14px] font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required placeholder="Enter your email"
                      className={inputClass}
                    />
                  </div>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full h-[44px] bg-[#8B5CF6] text-white text-[14px] font-medium rounded-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Sending link...' : 'Reset Password'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <Link href="/login" className="text-[14px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
