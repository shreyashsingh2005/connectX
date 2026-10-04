'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Check, X as XIcon } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Invalid or expired reset link');
        router.push('/login');
      }
    });
  }, [router, supabase.auth]);

  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strengthScore = Object.values(reqs).filter(Boolean).length;
  const isStrong = strengthScore === 5;

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (!isStrong) {
      toast.error('Please create a stronger password'); return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully');
      router.push('/chat');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-bg-surface dark:bg-[#0B0D12] border border-border-subtle rounded-[10px] h-[44px] px-[14px] text-text-main text-[14px] placeholder-text-muted focus:outline-none focus:border-brand focus:ring-[1px] focus:ring-brand/30 transition-all shadow-sm";

  return (
    <AuthLayout>
      <div className="w-full flex flex-col">
        <h2 className="text-[28px] md:text-[32px] font-[650] md:font-[700] text-text-main leading-tight tracking-tight mb-2">
          New password
        </h2>
        <p className="text-[14px] md:text-[15px] text-text-muted mb-8">
          Please enter your new password.
        </p>

        <form onSubmit={handleReset} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-[600] text-text-main block">New Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={`${inputClass} pr-[44px]`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-[4px] top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-text-sec transition-colors outline-none">
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
            
            {password.length > 0 && (
              <div className="pt-2 grid grid-cols-2 gap-y-2 gap-x-4">
                {Object.entries({
                  '8+ chars': reqs.length,
                  'Uppercase': reqs.upper,
                  'Lowercase': reqs.lower,
                  'Number': reqs.number,
                  'Special char': reqs.special,
                }).map(([label, met]) => (
                  <div key={label} className={cn("flex items-center gap-1.5 text-[11px] font-medium transition-colors", met ? "text-green-600 dark:text-green-500" : "text-text-muted")}>
                    {met ? <Check size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-[600] text-text-main block">Confirm Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" className={`${inputClass} pr-[44px]`} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full h-[44px] bg-[#8B5CF6] text-white text-[14px] font-[600] rounded-[10px] hover:bg-[#7C3AED] transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
            {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : null}
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
