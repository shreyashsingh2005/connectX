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

  const inputClass = "w-full bg-gray-100 dark:bg-[#11141A]/80 border border-gray-200 dark:border-[#252A34] rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all backdrop-blur-sm";

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F19] flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Premium Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full hidden" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full hidden" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-in-right">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ConnectXLogo size={56} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Recovery</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Securely reset your password</p>
        </div>

        <div className="bg-gray-50 dark:bg-[#111827]/70 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          {sent ? (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-[#8B5CF6]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                <Mail className="w-10 h-10 text-[#8B5CF6]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Check your email</h2>
              <p className="text-gray-600 dark:text-gray-400 text-[15px] mb-8 leading-relaxed">
                We&apos;ve sent a password reset link to <strong className="text-gray-900 dark:text-white">{email}</strong>.
                Please check your spam folder if you don&apos;t see it.
              </p>
              <Link href="/login" className="text-[#8B5CF6] hover:text-[#8B5CF6] text-sm font-semibold transition-colors flex items-center justify-center gap-2 hover:gap-3">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Forgot password?</h2>
              <p className="text-gray-600 dark:text-gray-400 text-[15px] mb-8 leading-relaxed">
                No worries, we&apos;ll send you reset instructions.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="Enter your email"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-[#8B5CF6] text-white font-semibold py-3.5 rounded-xl hover:opacity-90  transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#8B5CF6]/10"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? 'Sending link...' : 'Reset Password'}
                </button>
              </form>
              <div className="mt-8 text-center border-t border-white/5 pt-6">
                <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 hover:-translate-x-1 duration-300">
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


