'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, AtSign, Loader2, Check, X as XIcon } from 'lucide-react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'username' ? value.toLowerCase().replace(/[^a-z0-9_]/g, '') : value 
    }));
  };

  const reqs = useMemo(() => {
    const p = formData.password;
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  }, [formData.password]);

  const strengthScore = Object.values(reqs).filter(Boolean).length;
  const isStrong = strengthScore === 5;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (!isStrong) {
      toast.error('Please create a stronger password meeting all requirements'); return;
    }
    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters'); return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { display_name: formData.displayName, username: formData.username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success('Account created! Check your email to verify.');
      router.push('/login');
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('rate limit') || error?.status === 429) toast.error('Email sending is temporarily rate-limited. Please try again later.');
      else if (msg.toLowerCase().includes('already registered')) toast.error('This email is already registered. Please sign in.');
      else toast.error(msg || 'Registration failed. Please try again.');
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
            Join connectX
          </h1>
          <p className="text-[14px] text-text-sec text-center">
            Create an account to start chatting
          </p>
        </div>

        <form onSubmit={handleRegister} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-[500] text-text-main">Full Name</label>
            <div className="relative">
              <User className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
              <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} required placeholder="John Doe" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-[500] text-text-main">Username</label>
            <div className="relative">
              <AtSign className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
              <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="johndoe" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-[500] text-text-main">Email</label>
            <div className="relative">
              <Mail className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-[500] text-text-main">Password</label>
            <div className="relative">
              <Lock className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required placeholder="Create a strong password" className={`${inputClass} pr-[40px]`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-[8px] top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-sec transition-colors">
                {showPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
              </button>
            </div>
            {formData.password.length > 0 && (
              <div className="pt-2">
                <div className="flex gap-1.5 h-1.5 mb-3">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} className={cn("h-full flex-1 rounded-full transition-all duration-300", strengthScore >= level ? strengthScore < 3 ? "bg-[#EF4444]" : strengthScore < 5 ? "bg-[#F59E0B]" : "bg-[#22C55E]" : "bg-border-subtle")} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                  {[
                    { label: '8+ characters', met: reqs.length },
                    { label: 'Uppercase (A-Z)', met: reqs.upper },
                    { label: 'Lowercase (a-z)', met: reqs.lower },
                    { label: 'Number (0-9)', met: reqs.number },
                    { label: 'Special (@#$%)', met: reqs.special }
                  ].map(req => (
                    <div key={req.label} className="flex items-center gap-1.5">
                      {req.met ? <Check className="w-[12px] h-[12px] text-[#22C55E]" /> : <XIcon className="w-[12px] h-[12px] text-text-muted" />}
                      <span className={req.met ? "text-text-main" : "text-text-sec"}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[13px] font-[500] text-text-main">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
              <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Confirm your password" className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={loading || (formData.password.length > 0 && !isStrong)} className="w-full h-[40px] bg-brand text-white text-[13px] font-[600] rounded-[10px] hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[13px] text-text-sec mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand hover:text-brand-dark font-[600] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
