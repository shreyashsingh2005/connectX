'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import toast from 'react-hot-toast';
import { Camera, Save, Loader2, User, AtSign, Mail, FileText, Check, X as XIcon } from 'lucide-react';
import { debounce, cn } from '@/lib/utils';

export default function ProfilePage() {
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Username check
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced username availability check
  const checkUsername = useRef(
    debounce(async (val: string) => {
      if (!profile || val === profile.username) {
        setIsUsernameAvailable(true);
        setIsCheckingUsername(false);
        return;
      }
      if (val.length < 3) {
        setIsUsernameAvailable(null);
        setIsCheckingUsername(false);
        return;
      }
      setIsCheckingUsername(true);
      const normalized = val.toLowerCase();
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username_normalized', normalized)
        .single();
        
      if (error && error.code === 'PGRST116') {
        setIsUsernameAvailable(true);
      } else {
        setIsUsernameAvailable(false);
      }
      setIsCheckingUsername(false);
    }, 500)
  ).current;

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData(prev => ({ ...prev, username: val }));
    if (val !== profile?.username) {
      setIsCheckingUsername(true);
      checkUsername(val);
    } else {
      setIsUsernameAvailable(true);
      setIsCheckingUsername(false);
    }
  };

  if (!profile) return null;

  async function handleSave() {
    if (!profile) return;
    if (formData.username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
    if (!isUsernameAvailable) { toast.error('Username is not available'); return; }
    
    setIsSaving(true);
    try {
      const normalized = formData.username.toLowerCase();
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          username: formData.username,
          username_normalized: normalized,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        display_name: formData.display_name,
        username: formData.username,
        bio: formData.bio,
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

    setIsUploadingAvatar(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Avatar updated successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#0B0F19]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Profile</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({ display_name: profile.display_name, username: profile.username, bio: profile.bio });
              }}
              className="px-5 py-2.5 text-gray-500 hover:text-gray-900 dark:hover:text-white font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-[#1F2937] shadow-xl overflow-hidden animate-fade-in relative z-10">
          {/* Banner */}
          <div className="h-32 md:h-56 w-full gradient-bg relative">
             <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             <div className="absolute top-10 left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
          </div>

          {/* Main Content Area */}
          <div className="px-6 md:px-10 pb-10 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-24 mb-6">
              <div className="relative group w-fit">
                <UserAvatar
                  src={profile.avatar_url}
                  name={profile.display_name}
                  size="xl"
                  className="w-32 h-32 md:w-40 md:h-40 ring-8 ring-white dark:ring-[#111827] shadow-xl bg-white dark:bg-[#111827]"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-2 right-2 md:bottom-3 md:right-3 p-3 md:p-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl"
                >
                  {isUploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
              </div>
              
              {!isEditing && (
                <div className="flex flex-wrap items-center gap-3">
                   {/* Decorative elements or extra buttons could go here */}
                </div>
              )}
            </div>

            <div className="space-y-6 md:space-y-8 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                     <Mail className="w-4 h-4" /> Email
                   </label>
                   <div className="w-full bg-gray-50/50 dark:bg-[#0B0F19]/50 border border-gray-100 dark:border-[#1F2937]/50 rounded-xl py-3.5 px-4 text-gray-400 dark:text-gray-500 cursor-not-allowed font-medium">
                     {profile.email}
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                     <AtSign className="w-4 h-4" /> Username
                   </label>
                   {isEditing ? (
                     <div className="relative">
                       <input
                         type="text" value={formData.username} onChange={handleUsernameChange} maxLength={20}
                         className={cn(
                           "w-full bg-gray-50 dark:bg-[#0B0F19] border rounded-xl py-3.5 pl-4 pr-10 text-gray-900 dark:text-white font-medium focus:outline-none focus:bg-white transition-all shadow-inner",
                           isUsernameAvailable === true ? "border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20" :
                           isUsernameAvailable === false ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" :
                           "border-gray-200 dark:border-[#1F2937] focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                         )}
                       />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2">
                         {isCheckingUsername ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> :
                          isUsernameAvailable === true ? <Check className="w-4 h-4 text-green-500" /> :
                          isUsernameAvailable === false ? <XIcon className="w-4 h-4 text-red-500" /> : null}
                       </div>
                       {isUsernameAvailable === false && formData.username !== profile.username && (
                         <p className="text-xs text-red-500 mt-2 font-medium">Username is already taken</p>
                       )}
                     </div>
                   ) : (
                     <div className="w-full border border-transparent py-3.5 px-1 text-gray-900 dark:text-white font-bold text-lg">
                       @{profile.username}
                     </div>
                   )}
                 </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 dark:border-[#1F2937] pt-6 md:pt-8">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" /> Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text" value={formData.display_name} onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full md:w-1/2 bg-gray-50 dark:bg-[#0B0F19] border border-gray-200 dark:border-[#1F2937] rounded-xl py-3.5 px-4 text-gray-900 dark:text-white font-medium focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all shadow-inner"
                  />
                ) : (
                  <div className="w-full border border-transparent py-2 px-1 text-gray-900 dark:text-white font-extrabold text-2xl md:text-3xl tracking-tight break-words line-clamp-2">
                    {profile.display_name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" /> About
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} rows={4} placeholder="Write something about yourself..."
                    className="w-full bg-gray-50 dark:bg-[#0B0F19] border border-gray-200 dark:border-[#1F2937] rounded-xl py-4 px-4 text-gray-900 dark:text-white font-medium focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all shadow-inner resize-none"
                  />
                ) : (
                  <div className="w-full border border-transparent py-2 px-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-[15px]">
                    {profile.bio || <span className="text-gray-400 italic">No bio provided</span>}
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-10 border-t border-gray-100 dark:border-[#1F2937] pt-8">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isUsernameAvailable || formData.username.length < 3}
                  className="w-full md:w-auto px-10 py-4 gradient-bg text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
