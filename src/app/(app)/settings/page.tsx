
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
  Monitor, Moon, Sun, Camera, AtSign, CheckCircle2, Mail, LogOut, Edit2, KeyRound, Smartphone, ShieldCheck, UserRound, Palette, X, Ban, Clock,
  ArrowLeft, HelpCircle, Info
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { ProfilePhotoEditor } from '@/components/profile/ProfilePhotoEditor';
import { ChatThemePicker } from '@/components/chat/ChatThemePicker';
import { useThemeStore } from '@/store/useThemeStore';

type SettingsSection = 'main' | 'account' | 'appearance' | 'privacy' | 'notifications' | 'security' | 'help' | 'about';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const settings = useAuthStore(s => s.settings);
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  

  const { globalTheme, setGlobalTheme } = useThemeStore();
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
  
  
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const section = params.get("section");
      if (section && ["main", "account", "appearance", "privacy", "notifications", "security", "help", "about"].includes(section)) {
        setActiveSection(section);
      }
    }
  }, []);


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
      const avatarUrl = profile.avatar_url;
      
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

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F8FA] dark:bg-[#090B10]">
        <Loader2 size={32} strokeWidth={1.75} className="animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  const mainSections = [
    { id: 'appearance', label: 'Appearance', icon: Palette, colorClass: 'bg-[#8B5CF6]/10 text-[#8B5CF6] dark:bg-[#A78BFA]/10 dark:text-[#A78BFA]', status: null },
    { id: 'notifications', label: 'Notifications', icon: Bell, colorClass: 'bg-[#EC4899]/10 text-[#EC4899] dark:bg-[#F472B6]/10 dark:text-[#F472B6]', status: 'On' },
    { id: 'privacy', label: 'Privacy', icon: Eye, colorClass: 'bg-[#6366F1]/10 text-[#6366F1] dark:bg-[#818CF8]/10 dark:text-[#818CF8]', status: null },
    { id: 'security', label: 'Security', icon: ShieldCheck, colorClass: 'bg-[#10B981]/10 text-[#10B981] dark:bg-[#34D399]/10 dark:text-[#34D399]', status: null },
  ] as const;

  const secondarySections = [
    { id: 'account', label: 'Account', icon: UserRound, colorClass: 'bg-[#14B8A6]/10 text-[#14B8A6] dark:bg-[#2DD4BF]/10 dark:text-[#2DD4BF]' },
    { id: 'help', label: 'Help', icon: HelpCircle, colorClass: 'bg-[#F59E0B]/10 text-[#F59E0B] dark:bg-[#FBBF24]/10 dark:text-[#FBBF24]' },
    { id: 'about', label: 'About', icon: Info, colorClass: 'bg-[#0EA5E9]/10 text-[#0EA5E9] dark:bg-[#38BDF8]/10 dark:text-[#38BDF8]' },
  ] as const;

  const BackHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 py-4 md:py-6 px-4 md:px-0">
      <button onClick={() => setActiveSection('main')} className="p-1 -ml-1 text-[#667085] dark:text-[#98A2B3] hover:bg-[#EAECF0]/50 dark:hover:bg-[#151922] rounded-full transition-colors outline-none">
        <ArrowLeft size={20} strokeWidth={1.75} />
      </button>
      <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">{title}</h2>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F8FA] dark:bg-[#090B10] overflow-y-auto no-scrollbar items-center relative">
      <div className="w-full max-w-[600px] flex flex-col min-h-full">
        
        {/* MAIN OVERVIEW */}
        {activeSection === 'main' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-200 px-4 md:px-0 py-6">
            <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F5F7FA] mb-6">Settings</h1>

            {/* Compact Profile Header */}
            <div className="flex items-center gap-4 bg-[#FFFFFF] dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] p-4 mb-6 cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#1A1F2B] transition-colors" onClick={() => setActiveSection("account")}>
              <UserAvatar src={profile.avatar_url} name={profile.display_name} size="lg" className="w-[48px] h-[48px]" isOnline={true} />
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] truncate">{profile.display_name}</h2>
                <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] truncate">@{profile.username}</p>
              </div>
              <ChevronRight size={18} strokeWidth={1.75} className="text-[#98A2B3]" />
            </div>

            {/* Compact Lists */}
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-2 px-1">Preferences</h3>
                <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] overflow-hidden">
                  {mainSections.map((item, index) => (
                    <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={cn("flex items-center justify-between w-full p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#1A1F2B] transition-colors outline-none group", index !== mainSections.length - 1 && "border-b border-[#EAECF0] dark:border-[#252A34]")}>
                      <div className="flex items-center gap-3">
                        <item.icon size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3] group-hover:text-[#101828] dark:group-hover:text-[#F5F7FA] transition-colors" />
                        <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</span>
                      </div>
                      <ChevronRight size={16} strokeWidth={1.75} className="text-[#D0D5DD] dark:text-[#475467] group-hover:text-[#667085] dark:group-hover:text-[#98A2B3] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-2 px-1">More</h3>
                <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] overflow-hidden">
                  {secondarySections.map((item, index) => (
                    <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={cn("flex items-center justify-between w-full p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#1A1F2B] transition-colors outline-none group", index !== secondarySections.length - 1 && "border-b border-[#EAECF0] dark:border-[#252A34]")}>
                      <div className="flex items-center gap-3">
                        <item.icon size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3] group-hover:text-[#101828] dark:group-hover:text-[#F5F7FA] transition-colors" />
                        <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</span>
                      </div>
                      <ChevronRight size={16} strokeWidth={1.75} className="text-[#D0D5DD] dark:text-[#475467] group-hover:text-[#667085] dark:group-hover:text-[#98A2B3] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT SETTINGS */}
        {activeSection === 'account' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
            <BackHeader title="Account" />
            
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mt-2 mx-4 md:mx-0">
               <div className="flex flex-col p-2">
                 <button onClick={() => setIsEditingProfile(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                   <div className="flex flex-col text-left">
                     <span className="text-[12px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Display name</span>
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{profile.display_name}</span>
                   </div>
                   <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                 </button>
                 
                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                 
                 <button onClick={() => setIsEditingProfile(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                   <div className="flex flex-col text-left">
                     <span className="text-[12px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Username</span>
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">@{profile.username}</span>
                   </div>
                   <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                 </button>

                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                 
                 <div className="flex items-center justify-between p-3">
                   <div className="flex flex-col">
                     <span className="text-[12px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Email</span>
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{profile.email}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#10B981] dark:text-[#32D583]">
                      <CheckCircle2 size={14} strokeWidth={1.75} /> Verified
                   </div>
                 </div>

                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                 
                 <button onClick={() => setIsEditingProfile(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                   <div className="flex flex-col text-left">
                     <span className="text-[12px] text-[#667085] dark:text-[#98A2B3] mb-0.5">About</span>
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA] truncate max-w-[220px]">{profile.bio || 'No bio provided'}</span>
                   </div>
                   <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                 </button>
               </div>
            </div>

            <div className="px-4 md:px-0 mt-8">
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full h-[48px] bg-[#FFFFFF] dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] text-[#101828] dark:text-[#F5F7FA] rounded-[12px] text-[14px] font-medium hover:bg-[#F9FAFB] dark:hover:bg-[#151922] transition-colors shadow-sm">
                <LogOut size={16} strokeWidth={1.75} /> Sign out
              </button>
            </div>
            
            <div className="px-4 md:px-0 mt-6">
               <button className="flex items-center justify-center gap-2 w-full h-[48px] border border-[#F97066]/20 bg-[#FEF3F2]/50 dark:bg-[#7A271A]/10 text-[#D92D20] rounded-[12px] text-[14px] font-medium hover:bg-[#FEF3F2] dark:hover:bg-[#F97066]/10 transition-colors">
                  Delete account
               </button>
            </div>
          </div>
        )}

        {/* APPEARANCE */}
        
          
          {activeSection === 'appearance' && (
            <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
              <BackHeader title="Appearance" />
              
              <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mt-2 mx-4 md:mx-0">
                 <div className="flex flex-col p-2">
                   {/* Theme Mode */}
                   <div className="p-3">
                     <p className="text-[12px] text-[#667085] dark:text-[#98A2B3] mb-3">Theme</p>
                     <div className="flex bg-[#F7F8FA] dark:bg-[#090B10] rounded-[12px] p-1 border border-[#EAECF0] dark:border-[#252A34]">
                       {[
                         { id: 'light', icon: Sun, label: 'Light' },
                         { id: 'dark', icon: Moon, label: 'Dark' },
                         { id: 'system', icon: Monitor, label: 'System' },
                       ].map((t) => (
                         <button key={t.id} onClick={() => setTheme(t.id)} className={cn('flex-1 flex items-center justify-center gap-2 h-[44px] rounded-[10px] transition-all outline-none', theme === t.id ? 'bg-[#FFFFFF] dark:bg-[#151922] text-[#8B5CF6] dark:text-[#A78BFA] shadow-sm border border-[#EAECF0] dark:border-[#252A34]' : 'text-[#667085] dark:text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA]')}>
                           <t.icon size={16} strokeWidth={1.75} />
                           <span className="text-[13px] font-medium">{t.label}</span>
                         </button>
                       ))}
                     </div>
                   </div>
                   
                   <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                   
                   <button onClick={() => setShowThemePicker(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                     <div className="flex flex-col text-left">
                       <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Chat Theme</span>
                       <span className="text-[12px] text-[#667085] dark:text-[#98A2B3] capitalize mt-0.5">{globalTheme.backgroundId} • {globalTheme.accentColor}</span>
                     </div>
                     <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                   </button>
                 </div>
              </div>
            </div>
          )}

          {/* PRIVACY */}
        {activeSection === 'privacy' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
            <BackHeader title="Privacy" />
            
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mt-2 mx-4 md:mx-0">
               <div className="flex flex-col p-2">
                  {[
                    { key: 'show_online_status', label: 'Last seen', value: localSettings.show_online_status || 'everyone' },
                    { key: 'profile_visibility', label: 'Profile visibility', value: localSettings.profile_visibility || 'everyone' }
                  ].map((item, i) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group">
                        <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</span>
                        <div className="flex items-center gap-2">
                           <select
                             value={item.value}
                             onChange={e => {
                               setLocalSettings({ ...localSettings, [item.key]: e.target.value });
                               handleSaveSettings();
                             }}
                             className="appearance-none bg-transparent text-[13px] text-[#667085] dark:text-[#98A2B3] outline-none cursor-pointer text-right"
                           >
                             <option value="everyone">Everyone</option>
                             <option value="contacts">My Contacts</option>
                             <option value="nobody">Nobody</option>
                           </select>
                           <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] pointer-events-none" />
                        </div>
                      </div>
                      <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors">
                    <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Read receipts</span>
                    <label className="relative inline-flex items-center cursor-pointer mr-2">
                      <input 
                        type="checkbox" className="sr-only peer" 
                        checked={localSettings.read_receipts ?? true}
                        onChange={e => {
                          setLocalSettings({ ...localSettings, read_receipts: e.target.checked });
                          handleSaveSettings();
                        }}
                      />
                      <div className="w-[36px] h-[20px] bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                    </label>
                  </div>
                  
                  <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />

                  <button className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                    <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Blocked users</span>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeSection === 'notifications' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
            <BackHeader title="Notifications" />
            
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mt-2 mx-4 md:mx-0">
               <div className="flex flex-col p-2">
                  {[
                    { key: 'message_notifications', label: 'Message notifications' },
                    { key: 'group_notifications', label: 'Group mentions' },
                    { key: 'notification_sound', label: 'In-app sounds' },
                  ].map((item, i) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors">
                        <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer mr-2">
                          <input 
                            type="checkbox" className="sr-only peer" 
                            checked={(localSettings as any)[item.key] ?? true}
                            onChange={e => {
                              setLocalSettings({ ...localSettings, [item.key]: e.target.checked });
                              handleSaveSettings();
                            }}
                          />
                          <div className="w-[36px] h-[20px] bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                        </label>
                      </div>
                      {i < 2 && <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* SECURITY */}
        {activeSection === 'security' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
            <BackHeader title="Security" />
            
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mt-2 mx-4 md:mx-0">
               <div className="flex flex-col p-2">
                 <div className="flex items-center justify-between p-3">
                   <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Email verification</span>
                   <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#10B981] dark:text-[#32D583]">
                      <CheckCircle2 size={14} strokeWidth={1.75} /> Verified
                   </div>
                 </div>
                 
                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                 
                 <div className="flex items-center justify-between p-3">
                   <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">End-to-end encryption</span>
                   <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#8B5CF6] dark:text-[#A78BFA]">
                      <CheckCircle2 size={14} strokeWidth={1.75} /> Active
                   </div>
                 </div>

                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                 
                 <button className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                   <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Change password</span>
                   <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                 </button>

                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                 
                 <button className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                   <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Manage sessions</span>
                   <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* HELP & ABOUT */}
        {(activeSection === 'help' || activeSection === 'about') && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
            <BackHeader title={activeSection === 'help' ? 'Help' : 'About'} />
            
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mt-2 mx-4 md:mx-0 p-6 flex flex-col items-center justify-center min-h-[200px]">
               {activeSection === 'about' ? (
                 <>
                   <div className="w-12 h-12 bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] rounded-[14px] flex items-center justify-center text-white font-bold text-[20px] mb-4 shadow-sm">
                     cX
                   </div>
                   <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA]">connectX</h3>
                   <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1">Version 1.0.0</p>
                 </>
               ) : (
                 <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] text-center">Help centre coming soon.</p>
               )}
            </div>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/35 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] dark:bg-[#11141A] w-full sm:max-w-[440px] rounded-t-[24px] sm:rounded-[24px] shadow-2xl border border-transparent dark:border-[#252A34] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-[#EAECF0] dark:border-[#252A34]">
              <h2 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Edit profile</h2>
              <button onClick={() => setIsEditingProfile(false)} className="text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] transition-colors p-1 rounded-full hover:bg-[#F8FAFC] dark:hover:bg-[#151922] outline-none">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center gap-5">
                <div className="relative group cursor-pointer flex-shrink-0" onClick={() => setShowPhotoEditor(true)}>
                  <UserAvatar src={profile.avatar_url} name={profile.display_name} size="2xl" className="w-[64px] h-[64px]" />
                  <div className="absolute inset-0 bg-[#090B10]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={18} strokeWidth={1.75} className="text-white" />
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => setShowPhotoEditor(true)} className="h-[34px] px-3 bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors rounded-[8px] text-[13px] font-medium shadow-sm mb-1.5 outline-none">
                    Change photo
                  </button>
                  <p className="text-[12px] text-[#667085] dark:text-[#98A2B3]">JPG or PNG. Max 5MB.</p>
                </div>
                
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
                        <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                      </div>
                    ) : isUsernameAvailable === false ? (
                      <span className="text-[12px] font-medium text-[#D92D20] dark:text-[#F97066]">Taken</span>
                    ) : isUsernameAvailable === true && editForm.username.length >= 3 && editForm.username !== profile.username ? (
                      <span className="text-[12px] font-medium text-[#10B981] dark:text-[#32D583]">Available</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">About</label>
                <textarea
                  value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-[#FFFFFF] dark:bg-[#090B10] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-2 px-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm resize-none"
                  rows={2}
                />
              </div>
              
              <div className="pt-2 flex gap-3 mt-6">
                <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 h-[40px] bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] rounded-[10px] text-[13px] font-medium hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors shadow-sm outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUsernameAvailable === false} className="flex-1 h-[40px] bg-[#8B5CF6] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#7C3AED] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 outline-none">
                  {isSaving ? <Loader2 size={16} strokeWidth={2} className="animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
              
          </div>
        </div>
      )}
    
      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}
    
      <div data-testid="connectx-build-debug" className="p-4 text-center text-xs text-gray-500 font-mono opacity-50">
        CONNECTX_BUILD_DEBUG: 6c1ca4f
      </div>
    </div>
  );
}
