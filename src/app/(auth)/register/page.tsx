'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Check, X as XIcon } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
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

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/chat`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google signup failed');
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-bg-surface dark:bg-[#0B0D12] border border-border-subtle rounded-[10px] h-[44px] px-[14px] text-text-main text-[14px] placeholder-text-muted focus:outline-none focus:border-brand focus:ring-[1px] focus:ring-brand/30 transition-all shadow-sm";

  return (
    <AuthLayout>
      <div className="w-full flex flex-col pt-8 md:pt-0">
        <h2 className="text-[28px] md:text-[32px] font-[650] md:font-[700] text-text-main leading-tight tracking-tight mb-2">
          Create your account
        </h2>
        <p className="text-[14px] md:text-[15px] text-text-muted mb-8">
          Join connectX and start connecting.
        </p>

        <form onSubmit={handleRegister} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-[600] text-text-main block">Display name</label>
            <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} required placeholder="John Doe" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-[600] text-text-main block">Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="johndoe" className={inputClass} />
            <p className="text-[12px] text-text-sec pt-0.5">Only letters, numbers, and underscores</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-[600] text-text-main block">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-[600] text-text-main block">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className={`${inputClass} pr-[44px]`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-[4px] top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-text-sec transition-colors outline-none">
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
            {formData.password.length > 0 && (
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
              <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" className={`${inputClass} pr-[44px]`} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full h-[44px] bg-[#8B5CF6] text-white text-[14px] font-[600] rounded-[10px] hover:bg-[#7C3AED] transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
            {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : null}
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="relative w-full my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle" />
          </div>
          <div className="relative flex justify-center text-[12px]">
            <span className="px-3 bg-bg-surface text-text-muted font-[500]">Or continue with</span>
          </div>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading} className="w-full h-[44px] bg-bg-surface dark:bg-transparent border border-border-subtle text-[14px] font-[500] text-text-main rounded-[10px] hover:bg-bg-secondary transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-[13px] text-text-sec mt-8 pb-10 md:pb-0">
          Already have an account?{' '}
          <Link href="/login" className="text-brand hover:text-brand-dark font-[600] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
