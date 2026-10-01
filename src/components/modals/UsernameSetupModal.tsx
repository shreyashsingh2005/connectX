'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { AtSign, Loader2, Check, X as XIcon } from 'lucide-react';
import { cn, debounce } from '@/lib/utils';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';

export function UsernameSetupModal() {
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const [isOpen, setIsOpen] = useState(false);
  
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    // If we have a profile but no username, force them to set it.
    if (profile && (!profile.username || profile.username.trim() === '')) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [profile]);

  const checkAvailability = useCallback(
    debounce(async (val: string) => {
      if (val.length < 3) {
        setIsAvailable(null);
        setIsChecking(false);
        return;
      }
      setIsChecking(true);
      
      const normalized = val.toLowerCase();
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username_normalized', normalized)
        .single();
        
      if (error && error.code === 'PGRST116') {
        // Not found, which means available
        setIsAvailable(true);
      } else if (data) {
        setIsAvailable(false);
      } else {
        setIsAvailable(false);
      }
      
      setIsChecking(false);
    }, 500),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
    if (val.length >= 3) {
      setIsChecking(true);
      checkAvailability(val);
    } else {
      setIsAvailable(null);
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    if (!username || username.length < 3 || username.length > 20 || !isAvailable || !profile) return;
    
    setIsSaving(true);
    try {
      const normalized = username.toLowerCase();
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username, 
          username_normalized: normalized 
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      setProfile({ ...profile, username });
      toast.success('Username set successfully!');
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to set username');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[400px] bg-white dark:bg-[#11141A] rounded-[20px] shadow-xl border border-gray-200 dark:border-[#252A34] p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-4">
          <ConnectXLogo size={48} />
        </div>
        
        <h2 className="text-[22px] font-bold text-gray-900 dark:text-white mb-1">Choose your username</h2>
        <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
          This is how friends will find and add you.
        </p>

        <div className="space-y-4">
          <div className="relative text-left">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={username}
              onChange={handleChange}
              placeholder="username"
              maxLength={20}
              className={cn(
                "w-full bg-white dark:bg-[#0B0D12] border rounded-[10px] h-[44px] pl-10 pr-10 text-[14px] text-gray-900 dark:text-white focus:outline-none transition-all",
                isAvailable === true ? "border-green-500 focus:ring-1 focus:ring-green-500" :
                isAvailable === false ? "border-red-500 focus:ring-1 focus:ring-red-500" :
                "border-gray-200 dark:border-[#252A34] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isChecking ? (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              ) : isAvailable === true ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : isAvailable === false ? (
                <XIcon className="w-4 h-4 text-red-500" />
              ) : null}
            </div>
          </div>

          <div className="text-[13px] min-h-[20px] text-left">
            {isChecking && <span className="text-gray-500">Checking availability...</span>}
            {!isChecking && isAvailable === true && (
              <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
                ✓ @{username} is available
              </span>
            )}
            {!isChecking && isAvailable === false && username.length >= 3 && (
              <span className="text-red-600 dark:text-red-500 flex items-center gap-1">
                ✕ @{username} is already taken
              </span>
            )}
            {!isChecking && username.length > 0 && username.length < 3 && (
              <span className="text-gray-500">Username must be at least 3 characters</span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!isAvailable || isSaving || username.length < 3}
            className="w-full h-[44px] bg-[#8B5CF6] text-white text-[14px] font-medium rounded-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Confirm Username'}
          </button>
        </div>
      </div>
    </div>
  );
}
