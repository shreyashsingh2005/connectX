'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Loader2, Check, X as XIcon } from 'lucide-react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
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

  // Password strength states
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
      toast.error('Passwords do not match');
      return;
    }
    
    if (!isStrong) {
      toast.error('Please create a stronger password meeting all requirements');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success('Password updated successfully!');
      router.push('/chat');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
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
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-pink-600/15 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-in-right">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ConnectXLogo size={56} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Create new password</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Please enter your new password below</p>
        </div>

        <div className="bg-gray-50 dark:bg-[#111827]/70 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="Create a strong password"
                  className={`${inputClass} pr-12`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Password Strength UI */}
              {password.length > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-1.5 h-1.5 mb-3">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className={cn(
                        "h-full flex-1 rounded-full transition-all duration-500",
                        strengthScore >= level 
                          ? strengthScore < 3 ? "bg-red-500" : strengthScore < 5 ? "bg-yellow-500" : "bg-green-500"
                          : "bg-gray-200 dark:bg-[#151922]"
                      )} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    {[
                      { label: '8+ characters', met: reqs.length },
                      { label: 'Uppercase (A-Z)', met: reqs.upper },
                      { label: 'Lowercase (a-z)', met: reqs.lower },
                      { label: 'Number (0-9)', met: reqs.number },
                      { label: 'Special (@#$%)', met: reqs.special }
                    ].map(req => (
                      <div key={req.label} className="flex items-center gap-1.5">
                        {req.met ? <Check className="w-3.5 h-3.5 text-green-500" /> : <XIcon className="w-3.5 h-3.5 text-gray-600" />}
                        <span className={req.met ? "text-gray-700 dark:text-gray-300" : "text-gray-500"}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm your new password"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading || (password.length > 0 && !isStrong)}
              className="w-full bg-[#8B5CF6] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-[#8B5CF6]/25 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

