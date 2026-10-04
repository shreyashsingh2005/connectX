'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ArrowLeft, Camera, UserRound, AtSign, Loader2, Save } from 'lucide-react';
import { ProfilePhotoEditor } from '@/components/profile/ProfilePhotoEditor';

export default function ProfilePage() {
  const router = useRouter();
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: ''
  });

  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setEditForm({
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F8FA] dark:bg-bg-primary">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setEditForm(prev => ({ ...prev, username: value }));
    
    if (value === profile?.username) {
      setIsUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }
    
    if (value.length < 3) {
      setIsUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    
    usernameCheckTimeout.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', value)
        .single();
        
      if (error && error.code === 'PGRST116') setIsUsernameAvailable(true);
      else setIsUsernameAvailable(false);
      
      setIsCheckingUsername(false);
    }, 500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          username: editForm.username,
          bio: editForm.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      setProfile({
        ...profile,
        display_name: editForm.display_name,
        username: editForm.username,
        bio: editForm.bio,
      });
      
      toast.success('Profile updated successfully');
      router.push('/settings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F8FA] dark:bg-bg-primary overflow-y-auto items-center">
      <div className="w-full max-w-[600px] flex flex-col min-h-full pb-10">
        
        <div className="flex items-center justify-between py-6 px-4 md:px-0">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/settings')} className="p-1 -ml-1 text-text-sec hover:bg-[#EAECF0]/50 dark:hover:bg-[rgba(255,255,255,0.04)] rounded-full transition-colors outline-none">
              <ArrowLeft size={20} strokeWidth={1.75} />
            </button>
            <h1 className="text-[18px] font-bold text-text-main">Edit Profile</h1>
          </div>
        </div>

        <div className="px-4 md:px-0">
          <div className="bg-bg-surface rounded-[20px] border border-border-subtle p-6 shadow-sm">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              {/* Avatar Section */}
              <div className="flex items-center gap-5">
                <div className="relative group cursor-pointer flex-shrink-0" onClick={() => setShowPhotoEditor(true)}>
                  <UserAvatar src={profile.avatar_url} name={profile.display_name} size="2xl" className="w-[72px] h-[72px]" />
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={20} strokeWidth={1.75} className="text-white" />
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => setShowPhotoEditor(true)} className="h-[36px] px-4 bg-[#F1F3F5] dark:bg-[#1A1F2B] text-text-main hover:bg-[#E5E7EB] dark:hover:bg-[rgba(255,255,255,0.08)] transition-colors rounded-[10px] text-[13px] font-medium shadow-sm mb-1.5 outline-none">
                    Change photo
                  </button>
                  <p className="text-[12px] text-text-sec">JPG or PNG. Max 5MB.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-text-main">Display Name</label>
                <div className="relative">
                  <UserRound size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-sec" />
                  <input
                    type="text" required value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="w-full bg-bg-surface border border-border-subtle rounded-[12px] h-[44px] pl-10 pr-3 text-[14px] text-text-main focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-text-main">Username</label>
                <div className="relative">
                  <AtSign size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-sec" />
                  <input
                    type="text" required value={editForm.username} onChange={handleUsernameChange}
                    className={cn(
                      "w-full bg-bg-surface border rounded-[12px] h-[44px] pl-10 pr-20 text-[14px] text-text-main focus:outline-none focus:ring-1 transition-all shadow-sm",
                      isUsernameAvailable === false 
                        ? "border-[#F97066] focus:border-[#F97066] focus:ring-[#F97066]" 
                        : "border-border-subtle focus:border-[#8B5CF6] focus:ring-[#8B5CF6]"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 size={14} strokeWidth={2} className="animate-spin text-text-sec" />
                    ) : isUsernameAvailable === false ? (
                      <span className="text-[12px] font-medium text-[#D92D20] dark:text-[#F97066]">Taken</span>
                    ) : isUsernameAvailable === true && editForm.username.length >= 3 && editForm.username !== profile.username ? (
                      <span className="text-[12px] font-medium text-[#10B981] dark:text-[#32D583]">Available</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-text-main">Bio</label>
                <textarea
                  value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-bg-surface border border-border-subtle rounded-[12px] py-3 px-3 text-[14px] text-text-main focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm resize-none"
                  rows={3}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={isSaving || isUsernameAvailable === false} className="flex-1 h-[44px] bg-[#101828] dark:bg-[#F5F7FA] text-white dark:text-text-main rounded-[12px] text-[14px] font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 outline-none">
                  {isSaving ? <Loader2 size={16} strokeWidth={2} className="animate-spin" /> : <Save size={16} strokeWidth={2} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
      
      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}
    </div>
  );
}
