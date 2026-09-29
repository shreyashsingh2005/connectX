
'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserSettings } from '@/types';
import toast from 'react-hot-toast';
import { cn, generateAvatarUrl } from '@/lib/utils';
import { Shield, Bell, Eye, Lock, User, ChevronRight, Save, Loader2, Monitor, Moon, Sun, Camera, AtSign, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

type SettingsSection = 'account' | 'appearance' | 'privacy' | 'notifications' | 'security';

export default function SettingsPage() {
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
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(editForm.username)) {
      toast.error('Username must be 3-20 characters, letters, numbers and underscores only.');
      return;
    }

    setIsSaving(true);
    try {
      let newAvatarUrl = profile.avatar_url;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${profile.id}/${Date.now()}.${ext}`;
        
        // Attempt upload to 'avatars' or 'attachments' fallback
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments') // using attachments as a safe fallback bucket since it exists
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) {
          console.error(uploadError);
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
        avatar_url: newAvatarUrl
      }).eq('id', profile.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Username is already taken');
        } else {
          throw error;
        }
        return;
      }

      setProfile({
        ...profile,
        display_name: editForm.display_name,
        username: editForm.username,
        avatar_url: newAvatarUrl
      });
      
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
      setAvatarFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
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
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-[#0B0D12] relative overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto w-full px-4 py-8 md:py-12 flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#101828] dark:text-[#F5F7FA]">Settings</h1>
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
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] transition-colors',
                  activeSection === id
                    ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#A78BFA] font-medium'
                    : 'text-[#667085] dark:text-[#98A2B3] hover:bg-[#EAECF0]/50 dark:hover:bg-[#151922] hover:text-[#101828] dark:hover:text-[#F5F7FA]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={2} />
                  <span className="text-[14px]">{label}</span>
                </div>
                {activeSection === id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 bg-white dark:bg-[#11141A] rounded-[12px] border border-[#EAECF0] dark:border-[#252A34] p-6 md:p-8 shadow-sm h-fit">
            
            {activeSection === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Account</h2>
                  <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1">Manage your profile information and account details.</p>
                </div>
                
                {!isEditingProfile ? (
                  <div className="bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] overflow-hidden">
                    <div className="p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-white dark:border-[#11141A] shadow-md bg-[#EAECF0] dark:bg-[#252A34]">
                        {profile.avatar_url ? (
                          <Image src={profile.avatar_url} alt={profile.display_name} fill className="object-cover" />
                        ) : (
                          <Image src={generateAvatarUrl(profile.username)} alt={profile.display_name} fill className="object-cover" />
                        )}
                      </div>
                      
                      <div className="flex-1 text-center sm:text-left space-y-3 w-full">
                        <div>
                          <h3 className="text-xl font-bold text-[#101828] dark:text-[#F5F7FA]">{profile.display_name}</h3>
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1 text-[#8B5CF6]">
                            <AtSign size={14} />
                            <span className="text-[15px] font-medium">{profile.username}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-2 border-t border-[#EAECF0] dark:border-[#252A34]">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-[#667085] dark:text-[#98A2B3]">Email</span>
                            <span className="text-[14px] text-[#101828] dark:text-[#F5F7FA]">{profile.email}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-[#667085] dark:text-[#98A2B3]">Account Status</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#12B76A]/10 text-[#12B76A] text-[12px] font-medium">
                              <CheckCircle2 size={12} />
                              Active
                            </span>
                          </div>
                        </div>
                        
                        <div className="pt-4 flex justify-center sm:justify-start">
                          <button
                            onClick={() => {
                              setEditForm({ display_name: profile.display_name, username: profile.username });
                              setAvatarPreview(profile.avatar_url);
                              setIsEditingProfile(true);
                            }}
                            className="bg-white dark:bg-[#1A1F2B] border border-[#EAECF0] dark:border-[#374151] text-[#101828] dark:text-[#F5F7FA] text-[14px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#F8FAFC] dark:hover:bg-[#252A34] transition-colors shadow-sm"
                          >
                            Edit Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-[#11141A] shadow-md bg-[#EAECF0] dark:bg-[#252A34] group">
                          {avatarPreview ? (
                            <Image src={avatarPreview} alt="Preview" fill className="object-cover" />
                          ) : profile.avatar_url ? (
                            <Image src={profile.avatar_url} alt={profile.display_name} fill className="object-cover" />
                          ) : (
                            <Image src={generateAvatarUrl(profile.username)} alt={profile.display_name} fill className="object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Camera size={24} className="text-white" />
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarSelect}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">
                          Change Avatar
                        </button>
                      </div>

                      <div className="flex-1 space-y-4 w-full">
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-medium text-[#101828] dark:text-[#F5F7FA]">Display Name</label>
                          <input
                            type="text"
                            required
                            value={editForm.display_name}
                            onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                            className="w-full bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-2 px-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[13px] font-medium text-[#101828] dark:text-[#F5F7FA]">Username</label>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                            <input
                              type="text"
                              required
                              value={editForm.username}
                              onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                              className="w-full bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-2 pl-9 pr-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm"
                            />
                          </div>
                          <p className="text-[12px] text-[#667085] dark:text-[#98A2B3]">3-20 characters. Letters, numbers, and underscores only.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAECF0] dark:border-[#252A34]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setAvatarFile(null);
                        }}
                        className="bg-white dark:bg-[#1A1F2B] border border-[#EAECF0] dark:border-[#374151] text-[#101828] dark:text-[#F5F7FA] text-[14px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#F8FAFC] dark:hover:bg-[#252A34] transition-colors shadow-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-[#8B5CF6] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#7C3AED] transition-colors flex items-center gap-2 h-[40px] disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Appearance</h2>
                  <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1">Choose how connectX looks to you.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'system', icon: Monitor, label: 'System' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 h-[88px] rounded-[12px] border transition-colors',
                        theme === t.id
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/5 text-[#8B5CF6]'
                          : 'border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#151922] text-[#667085] dark:text-[#98A2B3] hover:border-[#8B5CF6]/50 hover:bg-[#F8FAFC] dark:hover:bg-[#1A1F2B]'
                      )}
                    >
                      <t.icon size={24} strokeWidth={1.5} />
                      <span className="text-[13px] font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Privacy</h2>
                  <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1">Control who can see your information.</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { key: 'show_online_status', label: 'Online Status', desc: 'Who can see when you are online' },
                    { key: 'show_last_seen', label: 'Last Seen', desc: 'Who can see your last seen time' },
                    { key: 'profile_visibility', label: 'Profile Visibility', desc: 'Who can view your profile' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-[#151922] rounded-[12px] border border-[#EAECF0] dark:border-[#252A34]">
                      <div>
                        <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</p>
                        <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">{item.desc}</p>
                      </div>
                      <select
                        value={localSettings[item.key as keyof UserSettings] as string || 'everyone'}
                        onChange={e => setLocalSettings({ ...localSettings, [item.key]: e.target.value })}
                        className="bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#374151] text-[#101828] dark:text-[#F5F7FA] text-[13px] font-medium rounded-[8px] py-2 px-3 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Friends</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveSettings} disabled={isSaving} className="bg-[#8B5CF6] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#7C3AED] transition-colors flex items-center gap-2 h-[40px]">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Privacy Settings
                </button>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Notifications</h2>
                  <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1">Manage your notification preferences.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'notifications_enabled', label: 'Push Notifications', desc: 'Receive push notifications' },
                    { key: 'message_notifications', label: 'Message Alerts', desc: 'Get notified for new messages' },
                    { key: 'group_notifications', label: 'Group Alerts', desc: 'Get notified for group activity' },
                    { key: 'notification_sound', label: 'Sound', desc: 'Play sound on new notifications' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-[#151922] rounded-[12px] border border-[#EAECF0] dark:border-[#252A34]">
                      <div>
                        <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</p>
                        <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={localSettings[item.key as keyof UserSettings] as boolean || false}
                          onChange={e => setLocalSettings({ ...localSettings, [item.key]: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8B5CF6]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveSettings} disabled={isSaving} className="bg-[#8B5CF6] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#7C3AED] transition-colors flex items-center gap-2 h-[40px]">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Notifications
                </button>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA] flex items-center gap-2">
                    <Shield size={18} className="text-[#12B76A]" />
                    Security & Privacy
                  </h2>
                  <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1">Manage your account security and encryption settings.</p>
                </div>

                <div className="bg-[#F8FAFC] dark:bg-[#151922] rounded-[12px] p-5 border border-[#EAECF0] dark:border-[#252A34] space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-[#12B76A]/10 text-[#12B76A] rounded-[8px]">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA]">End-to-End Encryption</h3>
                      <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1 leading-relaxed">
                        Your private conversations and files are protected by end-to-end encryption (E2EE) using WebCrypto AES-GCM & RSA-OAEP. Only the intended participants can decrypt them.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] dark:bg-[#151922] rounded-[12px] p-5 border border-[#EAECF0] dark:border-[#252A34] space-y-3">
                  <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] border-b border-[#EAECF0] dark:border-[#252A34] pb-3">Active Sessions</h3>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Monitor size={18} className="text-[#667085] dark:text-[#98A2B3]" />
                      <div>
                        <p className="font-medium text-[#101828] dark:text-[#F5F7FA] text-[14px]">Current Device</p>
                        <p className="text-[12px] text-[#12B76A]">Active now</p>
                      </div>
                    </div>
                    <div className="text-[12px] font-medium text-[#667085] dark:text-[#98A2B3] bg-[#EAECF0]/50 dark:bg-[#252A34] px-2.5 py-1 rounded-md">
                      This device
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Change Password</h3>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#101828] dark:text-[#F5F7FA]">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" className="w-full bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-2 px-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#101828] dark:text-[#F5F7FA]">Confirm New Password</label>
                    <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Repeat new password" className="w-full bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-2 px-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm" />
                  </div>
                  <button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword} className="bg-[#8B5CF6] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#7C3AED] transition-colors flex items-center justify-center gap-2 h-[40px] disabled:opacity-50">
                    {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
