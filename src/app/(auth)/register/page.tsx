'use client';

import { useState } from 'react';
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

  // Password strength states
  const reqs = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };
  const strengthScore = Object.values(reqs).filter(Boolean).length;
  const isStrong = strengthScore === 5;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'username' ? value.toLowerCase().replace(/[^a-z0-9_]/g, '') : value 
    }));
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!isStrong) {
      toast.error('Please create a stronger password meeting all requirements');
      return;
    }
    
    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
            username: formData.username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      toast.success('Account created! Check your email to verify.');
      router.push('/login');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-white dark:bg-[#151922] border border-gray-200 dark:border-[#252A34] rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-[#F5F7FA] placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all";

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Join <span className="gradient-text">connectX</span></h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Create an account to start chatting</p>
        </div>

        <div className="bg-white dark:bg-[#11141A] rounded-2xl border border-gray-200 dark:border-[#252A34] p-8 shadow-sm">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                <input
                  type="text" name="displayName" value={formData.displayName}
                  onChange={handleChange} required placeholder="John Doe"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                <input
                  type="text" name="username" value={formData.username}
                  onChange={handleChange} required placeholder="johndoe"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} required placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                  onChange={handleChange} required placeholder="Create a strong password"
                  className={`${inputClass} pr-12`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Password Strength UI */}
              {formData.password.length > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-1.5 h-1.5 mb-3">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className={cn(
                        "h-full flex-1 rounded-full transition-all duration-500",
                        strengthScore >= level 
                          ? strengthScore < 3 ? "bg-red-500" : strengthScore < 5 ? "bg-yellow-500" : "bg-green-500"
                          : "bg-gray-200 dark:bg-[#1F2937]"
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} required placeholder="Confirm your password"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading || (formData.password.length > 0 && !isStrong)}
              className="w-full gradient-bg text-white font-semibold py-3.5 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-[#8B5CF6] hover:text-[#7C3AED] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

