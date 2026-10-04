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

  const inputClass = "w-full bg-white dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] rounded-[11px] h-[44px] md:h-[48px] px-4 text-[#17151F] dark:text-[#F5F7FA] text-[15px] placeholder-[#777283] dark:placeholder-[#9A9FAD] focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/10 transition-all duration-150 shadow-sm";

  return (
    <AuthLayout>
      <div className="w-full flex flex-col">
        <h2 className="text-[28px] md:text-[32px] font-[700] text-text-main leading-tight tracking-[-0.02em] mb-1.5 animate-auth-stagger" style={{ animationDelay: '0ms' }}>
          New password
        </h2>
        <p className="text-[14px] md:text-[15px] text-[#777283] dark:text-[#9A9FAD] mb-8 animate-auth-stagger" style={{ animationDelay: '70ms' }}>
          Please enter your new password.
        </p>

        <form onSubmit={handleReset} className="w-full space-y-4">
          <div className="space-y-1.5 animate-auth-stagger" style={{ animationDelay: '140ms' }}>
            <label className="text-[12px] md:text-[13px] font-[600] text-text-main block">New Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={`${inputClass} pr-[48px]`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-[4px] top-1/2 -translate-y-1/2 w-[36px] h-[36px] md:w-[40px] md:h-[40px] flex items-center justify-center text-[#777283] dark:text-[#9A9FAD] hover:text-text-main hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D2A] rounded-[8px] transition-colors outline-none">
                {showPassword ? <EyeOff className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> : <Eye className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />}
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
                  <div key={label} className={cn("flex items-center gap-1.5 text-[11px] font-medium transition-colors", met ? "text-green-600 dark:text-green-500" : "text-[#777283] dark:text-[#9A9FAD]")}>
                    {met ? <Check size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 animate-auth-stagger" style={{ animationDelay: '200ms' }}>
            <label className="text-[12px] md:text-[13px] font-[600] text-text-main block">Confirm Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" className={`${inputClass} pr-[48px]`} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full h-[44px] md:h-[48px] bg-brand text-white text-[14px] md:text-[15px] font-[600] rounded-[11px] shadow-[0_4px_12px_rgba(139,92,246,0.25)] dark:shadow-none hover:bg-brand-dark hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none animate-auth-stagger" style={{ animationDelay: '260ms' }}>
            {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : null}
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
