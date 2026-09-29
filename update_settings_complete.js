const fs = require('fs');

const originalFile = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

const appearanceIndex = originalFile.indexOf(`{activeSection === 'appearance' && (`);
const appearanceAndBelow = originalFile.substring(appearanceIndex);

// We will construct the new first half
const newFirstHalf = `'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserSettings } from '@/types';
import toast from 'react-hot-toast';
import { cn, generateAvatarUrl, debounce } from '@/lib/utils';
import { 
  Shield, Bell, Eye, Lock, User, ChevronRight, Save, Loader2, 
  Monitor, Moon, Sun, Camera, AtSign, CheckCircle2, Mail, FileText, LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type SettingsSection = 'account' | 'appearance' | 'privacy' | 'notifications' | 'security';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const settings = useAuthStore(s => s.settings);
  const setSettings = useAuthStore(s => s.setSettings);
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>(settings || {});

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(true);

  useEffect(() => {
    if (profile && !isEditingProfile) {
      setEditForm({
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio || '',
      });
    }
  }, [profile, isEditingProfile]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

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
      const { error } = await supabase
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
    setEditForm(prev => ({ ...prev, username: val }));
    if (val !== profile?.username) {
      setIsCheckingUsername(true);
      checkUsername(val);
    } else {
      setIsUsernameAvailable(true);
      setIsCheckingUsername(false);
    }
  };

  async function handleSaveSettings() {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('user_settings').update(localSettings).eq('user_id', profile.id).select().single();
      if (error) throw error;
      setSettings(data);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmNewPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (editForm.username.length < 3) {
      toast.error('Username must be at least 3 characters.');
      return;
    }
    if (!isUsernameAvailable) {
      toast.error('Username is already taken.');
      return;
    }

    setIsSaving(true);
    try {
      let newAvatarUrl = profile.avatar_url;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = \`avatars/\${profile.id}/\${Date.now()}.\${ext}\`;
        
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) {
          toast.error('Failed to upload avatar.');
        } else {
          const { data } = supabase.storage.from('attachments').getPublicUrl(path);
          newAvatarUrl = data.publicUrl;
        }
      }

      const normalizedUsername = editForm.username.toLowerCase();
      
      const { error } = await supabase.from('profiles').update({
        display_name: editForm.display_name,
        username: editForm.username,
        username_normalized: normalizedUsername,
        bio: editForm.bio,
        avatar_url: newAvatarUrl
      }).eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        display_name: editForm.display_name,
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: newAvatarUrl
      });
      
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  }

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
  ] as const;

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FFFFFF] dark:bg-[#0B0D12] relative overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F5F7FA] tracking-tight">Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                  setIsEditingProfile(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-all',
                  activeSection === id
                    ? 'bg-[#F8FAFC] dark:bg-[#11141A] text-[#101828] dark:text-[#F5F7FA] font-medium shadow-sm border border-[#EAECF0] dark:border-[#252A34]'
                    : 'text-[#667085] dark:text-[#98A2B3] hover:bg-[#F8FAFC]/50 dark:hover:bg-[#11141A]/50 hover:text-[#101828] dark:hover:text-[#F5F7FA] border border-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={2} className={cn(activeSection === id ? 'text-[#8B5CF6] dark:text-[#A78BFA]' : '')} />
                  <span className="text-[14px]">{label}</span>
                </div>
                {activeSection === id && <ChevronRight size={16} className="text-[#98A2B3]" />}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 pb-12">
            {activeSection === 'account' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Profile Header Card */}
                <div className="bg-white dark:bg-[#151922] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] overflow-hidden shadow-sm">
                  <div className="h-32 bg-gradient-to-r from-[#8B5CF6]/10 to-[#EC4899]/10 dark:from-[#8B5CF6]/20 dark:to-[#EC4899]/20 relative">
                     <div className="absolute inset-0 bg-[#F8FAFC]/50 dark:bg-[#11141A]/50 backdrop-blur-[2px]"></div>
                  </div>
                  <div className="px-6 sm:px-8 pb-6 sm:pb-8 relative">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end -mt-12 sm:-mt-16 mb-4">
                      <div className="relative group">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#151922] bg-[#EAECF0] dark:bg-[#252A34] shadow-md relative">
                          {avatarPreview ? (
                            <Image src={avatarPreview} alt="Preview" fill className="object-cover" sizes="(max-width: 768px) 96px, 128px" />
                          ) : profile.avatar_url ? (
                            <Image src={profile.avatar_url} alt={profile.display_name} fill className="object-cover" sizes="(max-width: 768px) 96px, 128px" />
                          ) : (
                            <Image src={generateAvatarUrl(profile.username)} alt={profile.display_name} fill className="object-cover" sizes="(max-width: 768px) 96px, 128px" />
                          )}
                        </div>
                        {isEditingProfile && (
                          <>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute bottom-1 right-1 p-2 sm:p-2.5 bg-[#101828] dark:bg-[#F5F7FA] text-white dark:text-[#101828] rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg border-2 border-white dark:border-[#151922]"
                              aria-label="Change avatar"
                            >
                              <Camera size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
                          </>
                        )}
                      </div>
                      
                      <div className="flex-1 w-full pb-2">
                        {!isEditingProfile ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h2 className="text-xl sm:text-2xl font-bold text-[#101828] dark:text-[#F5F7FA] tracking-tight">{profile.display_name}</h2>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[14px] text-[#667085] dark:text-[#98A2B3]">@{profile.username}</span>
                                <span className="w-1 h-1 rounded-full bg-[#D0D5DD] dark:bg-[#374151]"></span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#12B76A]/10 text-[#12B76A] text-[12px] font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                                  Active
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setIsEditingProfile(true)}
                              className="bg-white dark:bg-[#1A1F2B] border border-[#EAECF0] dark:border-[#374151] text-[#101828] dark:text-[#F5F7FA] text-[14px] font-medium px-4 py-2 rounded-[10px] hover:bg-[#F8FAFC] dark:hover:bg-[#252A34] transition-all shadow-sm w-full sm:w-auto"
                            >
                              Edit Profile
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-[#101828] dark:text-[#F5F7FA]">Edit Profile</h2>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isEditingProfile ? (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <span className="flex items-center gap-2 text-[13px] font-medium text-[#667085] dark:text-[#98A2B3] mb-1">
                              <FileText size={14} /> About
                            </span>
                            <p className="text-[14px] text-[#101828] dark:text-[#F5F7FA] leading-relaxed whitespace-pre-wrap">
                              {profile.bio || <span className="text-[#98A2B3] italic">No bio provided.</span>}
                            </p>
                          </div>
                          <div>
                            <span className="flex items-center gap-2 text-[13px] font-medium text-[#667085] dark:text-[#98A2B3] mb-1">
                              <Mail size={14} /> Email Address
                            </span>
                            <p className="text-[14px] text-[#101828] dark:text-[#F5F7FA]">{profile.email}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5 animate-in fade-in duration-200">
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">Display Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                            <input
                              type="text" required value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                              className="w-full bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#374151] rounded-[10px] py-2.5 pl-10 pr-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">Username</label>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                            <input
                              type="text" required value={editForm.username} onChange={handleUsernameChange}
                              className={cn(
                                "w-full bg-white dark:bg-[#11141A] border rounded-[10px] py-2.5 pl-10 pr-10 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:ring-2 transition-all shadow-sm",
                                isUsernameAvailable === false 
                                  ? "border-[#F04438] focus:border-[#F04438] focus:ring-[#F04438]/20" 
                                  : "border-[#EAECF0] dark:border-[#374151] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/20"
                              )}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isCheckingUsername ? (
                                <Loader2 className="w-4 h-4 text-[#98A2B3] animate-spin" />
                              ) : isUsernameAvailable === true && editForm.username.length >= 3 ? (
                                <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                              ) : null}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[12px] text-[#667085] dark:text-[#98A2B3]">3-20 characters. Letters, numbers, underscores.</p>
                            {isUsernameAvailable === false && <p className="text-[12px] text-[#F04438] font-medium">Username taken</p>}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">Bio (Optional)</label>
                          <textarea
                            value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Write a short bio..."
                            rows={3}
                            className="w-full bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#374151] rounded-[10px] py-2.5 px-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all shadow-sm resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAECF0] dark:border-[#252A34]">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingProfile(false);
                              setAvatarFile(null);
                              setAvatarPreview(null);
                              setEditForm({ display_name: profile.display_name, username: profile.username, bio: profile.bio || '' });
                            }}
                            className="px-4 py-2 text-[14px] font-medium text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F8FAFC] dark:hover:bg-[#252A34] rounded-[10px] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSaving || isCheckingUsername || isUsernameAvailable === false}
                            className="bg-[#101828] dark:bg-[#F5F7FA] text-white dark:text-[#101828] text-[14px] font-medium px-5 py-2 rounded-[10px] hover:bg-[#1D2939] dark:hover:bg-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Changes
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Account & Security Summary */}
                {!isEditingProfile && (
                  <>
                    <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mt-8 mb-4 px-1">Account & Security</h3>
                    <div className="bg-white dark:bg-[#151922] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm divide-y divide-[#EAECF0] dark:divide-[#252A34]">
                      <div className="p-4 sm:p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#12B76A]/10 flex items-center justify-center text-[#12B76A]">
                            <Mail size={16} />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Email Verification</p>
                            <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">Verified</p>
                          </div>
                        </div>
                        <CheckCircle2 size={18} className="text-[#12B76A]" />
                      </div>
                      
                      <div className="p-4 sm:p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] dark:text-[#A78BFA]">
                            <Shield size={16} />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">End-to-End Encryption</p>
                            <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">Active for all conversations</p>
                          </div>
                        </div>
                        <CheckCircle2 size={18} className="text-[#12B76A]" />
                      </div>

                      <div className="p-4 sm:p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
                            <Monitor size={16} />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Active Sessions</p>
                            <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">1 session (This device)</p>
                          </div>
                        </div>
                        <button onClick={() => setActiveSection('security')} className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">
                          Manage
                        </button>
                      </div>
                    </div>

                    <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mt-8 mb-4 px-1">Account Actions</h3>
                    <div className="bg-white dark:bg-[#151922] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm overflow-hidden">
                      <button onClick={() => setActiveSection('security')} className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#F8FAFC] dark:hover:bg-[#11141A] transition-colors border-b border-[#EAECF0] dark:border-[#252A34]">
                        <div className="flex items-center gap-3">
                          <Lock size={18} className="text-[#667085] dark:text-[#98A2B3]" />
                          <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Change Password</span>
                        </div>
                        <ChevronRight size={18} className="text-[#98A2B3]" />
                      </button>
                      
                      <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 transition-colors group">
                        <div className="flex items-center gap-3">
                          <LogOut size={18} className="text-[#F04438] group-hover:text-[#D92D20] transition-colors" />
                          <span className="text-[14px] font-medium text-[#F04438] group-hover:text-[#D92D20] transition-colors">Log out</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
`;

fs.writeFileSync('src/app/(app)/settings/page.tsx', newFirstHalf + appearanceAndBelow);
