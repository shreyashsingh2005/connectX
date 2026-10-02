
'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserSettings } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { 
  Bell, Eye, Lock, ChevronRight, Loader2, 
  Monitor, Moon, Sun, Camera, AtSign, CheckCircle2, Mail, LogOut, Edit2, KeyRound, Smartphone, ShieldCheck, UserRound, Palette, X, Ban, Clock
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

type SettingsSection = 'account' | 'appearance' | 'privacy' | 'notifications' | 'security';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const settings = useAuthStore(s => s.settings);
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>(settings || {});
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || ''
      });
    }
  }, [profile, isEditingProfile]);

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
    
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
    
    usernameCheckTimeout.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', value)
        .single();
        
      if (error && error.code === 'PGRST116') {
        setIsUsernameAvailable(true);
      } else {
        setIsUsernameAvailable(false);
      }
      setIsCheckingUsername(false);
    }, 500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSaving(true);
    try {
      let avatarUrl = profile.avatar_url;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${profile.id}/${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = publicUrl;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          username: editForm.username,
          bio: editForm.bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      setProfile({
        ...profile,
        display_name: editForm.display_name,
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: avatarUrl,
      });
      
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings?.id) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update(localSettings)
        .eq('id', settings.id);
        
      if (error) throw error;
      
      useAuthStore.getState().setSettings({ ...settings, ...localSettings });
      toast.success('Settings saved');
    } catch (error: any) {
      toast.error('Failed to save settings');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      useAuthStore.getState().setProfile(null);
      useAuthStore.getState().setSettings(null);
      router.push('/login');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  const sections = [
    { id: 'account', label: 'Account', icon: UserRound },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ] as const;

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#090B10]">
        <Loader2 size={32} strokeWidth={1.75} className="animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  const ThemePreview = ({ mode }: { mode: 'light' | 'dark' | 'system' }) => {
    // Standardize system preview as a mix or default to light visually for structure
    const isDark = mode === 'dark' || (mode === 'system' && theme === 'dark');
    return (
      <div className={cn(
        "mt-3 w-full h-[88px] rounded-[10px] overflow-hidden border flex flex-col pointer-events-none transition-colors",
        isDark ? "bg-[#090B10] border-[#252A34]" : "bg-[#F8FAFC] border-[#EAECF0]"
      )}>
        {/* Header */}
        <div className={cn(
          "h-6 w-full border-b flex items-center px-3",
          isDark ? "bg-[#101319] border-[#252A34]" : "bg-[#FFFFFF] border-[#EAECF0]"
        )}>
          <div className={cn("w-12 h-2 rounded-full", isDark ? "bg-[#252A34]" : "bg-[#E2E8F0]")}></div>
        </div>
        {/* Body */}
        <div className="flex-1 flex px-2 py-2 gap-2">
          {/* Sidebar */}
          <div className={cn("w-8 h-full rounded-[6px]", isDark ? "bg-[#101319]" : "bg-[#FFFFFF]")}></div>
          {/* Messages */}
          <div className="flex-1 flex flex-col gap-2 justify-end pb-1">
             <div className={cn("w-[65%] h-3.5 rounded-[6px] rounded-tl-sm self-start", isDark ? "bg-[#151922]" : "bg-[#FFFFFF] border border-[#EAECF0]")}></div>
             <div className={cn("w-[75%] h-3.5 rounded-[6px] rounded-tr-sm self-end", isDark ? "bg-[#8B5CF6]/20" : "bg-[#8B5CF6]/10")}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-[#090B10] overflow-y-auto custom-scrollbar">
      <div className="max-w-[1140px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex-1 flex flex-col">
        <div className="mb-8 md:mb-10">
          <h1 className="text-[30px] font-[650] tracking-[-0.02em] text-[#101828] dark:text-[#F5F7FA] mb-1.5">Settings</h1>
          <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Manage your account, privacy, appearance and security.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          {/* Navigation */}
          <div className="w-full md:w-[240px] flex-shrink-0 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0 border-b md:border-none border-[#EAECF0] dark:border-[#252A34]">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 md:h-[44px] rounded-[10px] transition-all whitespace-nowrap outline-none relative group',
                  activeSection === id
                    ? 'bg-[#8B5CF6]/10 text-[#7C3AED] dark:text-[#A78BFA] font-medium'
                    : 'text-[#667085] dark:text-[#98A2B3] hover:bg-[#EAECF0]/50 dark:hover:bg-[#11141A] hover:text-[#101828] dark:hover:text-[#F5F7FA]'
                )}
              >
                {activeSection === id && (
                  <span className="absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-r-full bg-[#8B5CF6] hidden md:block"></span>
                )}
                <Icon size={17} strokeWidth={1.75} className={cn("ml-1 md:ml-2 transition-colors", activeSection === id ? 'text-[#8B5CF6]' : 'text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#D0D5DD]')} />
                <span className="text-[14px]">{label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 pb-16">
            {activeSection === 'account' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Profile Identity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:px-8 bg-[#FFFFFF] dark:bg-[#101319] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-10 gap-5">
                  <div className="flex items-center gap-5">
                    <UserAvatar src={profile.avatar_url} name={profile.display_name} size="2xl" className="w-[64px] h-[64px] md:w-[72px] md:h-[72px]" isOnline={true} />
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA]">{profile.display_name}</h3>
                      <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mb-1.5">@{profile.username}</p>
                      <div className="flex items-center gap-1.5 text-[13px] text-[#12B76A] font-medium bg-[#12B76A]/10 w-fit px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                        Active
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center justify-center gap-2 h-[40px] px-4 bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors rounded-[9px] text-[14px] font-medium shadow-sm w-full sm:w-auto"
                  >
                    <Edit2 size={16} strokeWidth={1.75} /> Edit profile
                  </button>
                </div>

                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-3 ml-1">Profile information</h3>
                <div className="bg-[#FFFFFF] dark:bg-[#101319] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-10 overflow-hidden">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:px-6 border-b border-[#EAECF0] dark:border-[#252A34] gap-2 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors">
                     <div>
                       <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Display name</p>
                       <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{profile.display_name}</p>
                     </div>
                     <button onClick={() => setIsEditingProfile(true)} className="text-[14px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">Edit</button>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:px-6 border-b border-[#EAECF0] dark:border-[#252A34] gap-2 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors">
                     <div>
                       <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Username</p>
                       <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">@{profile.username}</p>
                     </div>
                     <button onClick={() => setIsEditingProfile(true)} className="text-[14px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">Edit</button>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:px-6 border-b border-[#EAECF0] dark:border-[#252A34] gap-2 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors">
                     <div>
                       <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Email</p>
                       <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{profile.email}</p>
                     </div>
                     <div className="flex items-center gap-1.5 self-start sm:self-auto text-[14px] font-medium text-[#667085] dark:text-[#98A2B3]">
                        <CheckCircle2 size={16} strokeWidth={1.75} className="text-[#12B76A]" /> Verified
                     </div>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:px-6 gap-2 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors">
                     <div>
                       <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mb-0.5">About</p>
                       <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{profile.bio || 'No bio provided'}</p>
                     </div>
                     <button onClick={() => setIsEditingProfile(true)} className="text-[14px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">{profile.bio ? 'Edit' : 'Add'}</button>
                   </div>
                </div>
                
                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-3 ml-1">Account status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                   <div className="bg-[#FFFFFF] dark:bg-[#101319] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] p-5 shadow-sm">
                     <div className="w-10 h-10 rounded-full bg-[#12B76A]/10 flex items-center justify-center text-[#12B76A] mb-4">
                       <Mail size={16} strokeWidth={1.75} />
                     </div>
                     <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Email verification</p>
                     <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Verified</p>
                   </div>
                   <div className="bg-[#FFFFFF] dark:bg-[#101319] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] p-5 shadow-sm">
                     <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] mb-4">
                       <ShieldCheck size={16} strokeWidth={1.75} />
                     </div>
                     <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Encryption</p>
                     <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Active</p>
                   </div>
                   <div className="bg-[#FFFFFF] dark:bg-[#101319] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] p-5 shadow-sm">
                     <div className="w-10 h-10 rounded-full bg-[#12B76A]/10 flex items-center justify-center text-[#12B76A] mb-4">
                       <Monitor size={16} strokeWidth={1.75} />
                     </div>
                     <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Session</p>
                     <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Active now</p>
                   </div>
                </div>

                <div className="pt-10 border-t border-[#EAECF0] dark:border-[#252A34]">
                  <h3 className="text-[14px] font-semibold text-[#D92D20] mb-3 ml-1">Danger zone</h3>
                  <div className="border border-[#F97066]/20 bg-[#FEF3F2]/50 dark:bg-[#7A271A]/10 rounded-[16px] p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Delete account</p>
                        <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1 max-w-[400px]">Permanently delete your account and all data. This action cannot be undone.</p>
                      </div>
                      <button className="h-[40px] px-4 bg-[#FFFFFF] dark:bg-[#151922] border border-[#F97066]/30 text-[#D92D20] rounded-[9px] text-[14px] font-medium hover:bg-[#FEF3F2] dark:hover:bg-[#F97066]/10 transition-colors whitespace-nowrap shadow-sm">
                        Delete account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1.5">Appearance</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Customize how connectX looks across your devices.</p>
                </div>
                
                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-4 ml-1">Theme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                  {[
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'system', icon: Monitor, label: 'System' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        'flex flex-col items-start p-4 rounded-[16px] border transition-all text-left shadow-sm',
                        theme === t.id
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/5 dark:bg-[#8B5CF6]/10 ring-1 ring-[#8B5CF6]'
                          : 'border-[#EAECF0] dark:border-[#252A34] bg-[#FFFFFF] dark:bg-[#101319] hover:border-[#8B5CF6]/50 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]'
                      )}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <t.icon size={18} strokeWidth={1.75} className={theme === t.id ? 'text-[#8B5CF6]' : 'text-[#667085] dark:text-[#98A2B3]'} />
                        <span className={cn("text-[14px] font-medium", theme === t.id ? "text-[#8B5CF6]" : "text-[#101828] dark:text-[#F5F7FA]")}>{t.label}</span>
                      </div>
                      <ThemePreview mode={t.id as any} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1.5">Privacy</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Control how your information and activity are shared.</p>
                </div>
                
                <div className="bg-[#FFFFFF] dark:bg-[#101319] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] shadow-sm overflow-hidden mb-6">
                  {[
                    { key: 'show_online_status', label: 'Online status', desc: 'Choose who can see when you are online.', icon: Monitor },
                    { key: 'show_last_seen', label: 'Last seen', desc: 'Choose who can see when you were last active.', icon: Clock },
                    { key: 'profile_visibility', label: 'Profile visibility', desc: 'Control who can view your profile details.', icon: UserRound },
                  ].map((item, i) => (
                    <div key={item.key} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors", i !== 0 && "border-t border-[#EAECF0] dark:border-[#252A34]")}>
                      <div className="flex gap-4">
                        <item.icon size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</p>
                          <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <select
                        value={localSettings[item.key as keyof UserSettings] as string || 'everyone'}
                        onChange={e => {
                          setLocalSettings({ ...localSettings, [item.key]: e.target.value });
                          handleSaveSettings();
                        }}
                        className="bg-[#F8FAFC] dark:bg-[#090B10] border border-[#EAECF0] dark:border-[#252A34] text-[#101828] dark:text-[#F5F7FA] text-[13px] font-medium rounded-[8px] px-3 py-2 h-[40px] outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] min-w-[140px] shadow-sm ml-10 sm:ml-0"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Contacts</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div className="bg-[#FFFFFF] dark:bg-[#101319] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] shadow-sm overflow-hidden mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors">
                    <div className="flex gap-4">
                      <CheckCircle2 size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Read receipts</p>
                        <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">Let others know when you've read their messages.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-10 sm:ml-0">
                      <input 
                        type="checkbox" className="sr-only peer" 
                        checked={localSettings.read_receipts ?? true}
                        onChange={e => {
                          setLocalSettings({ ...localSettings, read_receipts: e.target.checked });
                          handleSaveSettings();
                        }}
                      />
                      <div className="w-9 h-5 bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] dark:bg-[#101319] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors cursor-pointer">
                    <div className="flex gap-4">
                      <Ban size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Blocked users</p>
                        <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">Manage the users you have blocked.</p>
                      </div>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] hidden sm:block" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1.5">Notifications</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Choose how connectX keeps you informed.</p>
                </div>
                
                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-3 ml-1">Messages</h3>
                <div className="bg-[#FFFFFF] dark:bg-[#101319] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] shadow-sm overflow-hidden mb-8">
                  {[
                    { key: 'notifications_enabled', label: 'Push notifications', desc: 'Enable all push notifications across devices.', icon: Bell },
                    { key: 'message_notifications', label: 'Direct messages', desc: 'Notify me when I receive a DM.', icon: Mail },
                    { key: 'group_notifications', label: 'Group messages', desc: 'Notify me about group activity and mentions.', icon: UserRound },
                    { key: 'notification_sound', label: 'Notification sounds', desc: 'Play a subtle sound for new notifications.', icon: Bell }, // Reusing Bell as Music icon is unavailable in this reduced import
                  ].map((item, i) => (
                    <div key={item.key} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors", i !== 0 && "border-t border-[#EAECF0] dark:border-[#252A34]")}>
                      <div className="flex gap-4">
                        <item.icon size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</p>
                          <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-10 sm:ml-0">
                        <input 
                          type="checkbox" className="sr-only peer" 
                          checked={(localSettings as any)[item.key] ?? true}
                          onChange={e => {
                            setLocalSettings({ ...localSettings, [item.key]: e.target.checked });
                            handleSaveSettings();
                          }}
                        />
                        <div className="w-9 h-5 bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1.5">Security</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Protect your account and manage your active sessions.</p>
                </div>
                
                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-3 ml-1">Security overview</h3>
                <div className="bg-[#FFFFFF] dark:bg-[#101319] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-8 overflow-hidden">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 border-b border-[#EAECF0] dark:border-[#252A34] gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors">
                     <div className="flex gap-4">
                       <div className="w-9 h-9 rounded-full bg-[#12B76A]/10 flex items-center justify-center text-[#12B76A] flex-shrink-0">
                         <Mail size={16} strokeWidth={1.75} />
                       </div>
                       <div>
                         <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Email verification</p>
                         <p className="text-[13px] text-[#12B76A] mt-0.5 font-medium">Verified</p>
                       </div>
                     </div>
                   </div>

                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 border-b border-[#EAECF0] dark:border-[#252A34] gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors">
                     <div className="flex gap-4">
                       <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] flex-shrink-0">
                         <ShieldCheck size={16} strokeWidth={1.75} />
                       </div>
                       <div>
                         <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">End-to-end encryption</p>
                         <p className="text-[13px] text-[#8B5CF6] mt-0.5 font-medium">Active</p>
                       </div>
                     </div>
                   </div>

                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 border-b border-[#EAECF0] dark:border-[#252A34] gap-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors cursor-pointer">
                     <div className="flex gap-4">
                       <div className="w-9 h-9 rounded-full bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] flex items-center justify-center text-[#667085] dark:text-[#98A2B3] flex-shrink-0">
                         <KeyRound size={16} strokeWidth={1.75} />
                       </div>
                       <div>
                         <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Password</p>
                         <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">Manage password</p>
                       </div>
                     </div>
                     <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] hidden sm:block" />
                   </div>
                </div>

                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-3 ml-1">Active sessions</h3>
                <div className="bg-[#FFFFFF] dark:bg-[#101319] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-10 overflow-hidden">
                   <div className="flex items-center justify-between p-5 sm:px-6 hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/50 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] flex items-center justify-center text-[#667085] dark:text-[#98A2B3] flex-shrink-0">
                         <Smartphone size={16} strokeWidth={1.75} />
                       </div>
                       <div>
                         <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">This device</p>
                         <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">Current browser</p>
                            <span className="w-1 h-1 rounded-full bg-[#D0D5DD] dark:bg-[#374151]"></span>
                            <span className="text-[12px] text-[#12B76A] font-medium">Active now</span>
                         </div>
                       </div>
                     </div>
                   </div>
                   <div className="p-4 border-t border-[#EAECF0] dark:border-[#252A34] flex justify-center bg-[#F9FAFB] dark:bg-[#151922]/30">
                      <button className="text-[13px] font-medium text-[#667085] dark:text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] transition-colors">
                        Sign out other devices
                      </button>
                   </div>
                </div>

                <div className="pt-8 border-t border-[#EAECF0] dark:border-[#252A34]">
                  <button onClick={handleLogout} className="flex items-center gap-2 h-[40px] px-4 bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#101828] dark:text-[#F5F7FA] rounded-[9px] text-[14px] font-medium hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors shadow-sm w-full sm:w-auto justify-center">
                    <LogOut size={16} strokeWidth={1.75} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/35 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] dark:bg-[#101319] w-full sm:max-w-[480px] rounded-t-[20px] sm:rounded-[16px] shadow-2xl border border-[#EAECF0] dark:border-[#252A34] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-[#EAECF0] dark:border-[#252A34]">
              <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Edit profile</h2>
              <button onClick={() => setIsEditingProfile(false)} className="text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] transition-colors p-1 rounded-full hover:bg-[#F8FAFC] dark:hover:bg-[#151922]">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-5">
                <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                  <UserAvatar src={avatarPreview || profile.avatar_url} name={profile.display_name} size="2xl" className="w-[72px] h-[72px]" />
                  <div className="absolute inset-0 bg-[#090B10]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={20} strokeWidth={1.5} className="text-white" />
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="h-[36px] px-3 bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors rounded-[8px] text-[13px] font-medium shadow-sm mb-1.5">
                    Change photo
                  </button>
                  <p className="text-[12px] text-[#667085] dark:text-[#98A2B3]">JPG, GIF or PNG. Max size of 5MB.</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">Display Name</label>
                <div className="relative">
                  <UserRound size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                  <input
                    type="text" required value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="w-full bg-[#FFFFFF] dark:bg-[#090B10] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] h-[44px] pl-9 pr-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">Username</label>
                <div className="relative">
                  <AtSign size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                  <input
                    type="text" required value={editForm.username} onChange={handleUsernameChange}
                    className={cn(
                      "w-full bg-[#FFFFFF] dark:bg-[#090B10] border rounded-[10px] h-[44px] pl-9 pr-20 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:ring-1 transition-all shadow-sm",
                      isUsernameAvailable === false 
                        ? "border-[#F97066] focus:border-[#F97066] focus:ring-[#F97066]" 
                        : "border-[#EAECF0] dark:border-[#252A34] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#667085] dark:text-[#98A2B3]">
                        <Loader2 size={14} strokeWidth={2} className="animate-spin" /> Checking
                      </div>
                    ) : isUsernameAvailable === false ? (
                      <span className="text-[12px] font-medium text-[#D92D20] dark:text-[#F97066]">Taken</span>
                    ) : isUsernameAvailable === true && editForm.username.length >= 3 && editForm.username !== profile.username ? (
                      <span className="text-[12px] font-medium text-[#12B76A] dark:text-[#32D583]">Available</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">About</label>
                <textarea
                  value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-[#FFFFFF] dark:bg-[#090B10] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-[10px] px-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm resize-none"
                  rows={3}
                  placeholder="Tell us a little about yourself"
                />
              </div>
              
              <div className="pt-2 flex gap-3 mt-8">
                <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 h-[44px] bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] rounded-[10px] text-[14px] font-medium hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors shadow-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUsernameAvailable === false} className="flex-1 h-[44px] bg-[#8B5CF6] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#7C3AED] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} strokeWidth={2} className="animate-spin" /> : null}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
