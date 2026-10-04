
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserSettings } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { 
  MessageSquare, Bell, Eye, Lock, ChevronRight, Loader2, 
  Monitor, Moon, Sun, Camera, AtSign, CheckCircle2, Mail, LogOut, Edit2, KeyRound, Smartphone, ShieldCheck, UserRound, Palette, X, Ban, Clock,
  ArrowLeft, HelpCircle, Info
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { ProfilePhotoEditor } from '@/components/profile/ProfilePhotoEditor';
import { ChatThemePicker } from '@/components/chat/ChatThemePicker';
import { useThemeStore } from '@/store/useThemeStore';

type SettingsSection = 'main' | 'account' | 'appearance' | 'privacy' | 'notifications' | 'security' | 'help' | 'about';


function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-surface rounded-[16px] w-full max-w-sm overflow-hidden border border-border-subtle shadow-xl">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="font-semibold text-text-main">Change Password</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-sec dark:hover:text-text-muted"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-text-sec mb-1">New Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-bg-secondary border border-border-subtle rounded-[10px] px-3 py-2 text-[13px] text-text-main focus:outline-none focus:border-[#8B5CF6]" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-sec mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required className="w-full bg-bg-secondary border border-border-subtle rounded-[10px] px-3 py-2 text-[13px] text-text-main focus:outline-none focus:border-[#8B5CF6]" />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[12px] font-medium text-text-sec">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-[12px] font-medium text-white bg-brand rounded-[10px] hover:bg-brand-dark disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;
    loadDevices();
  }, [isOpen]);

  async function loadDevices() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_devices').select('*').eq('user_id', user.id).order('last_seen_at', { ascending: false });
    if (data) setDevices(data);
    setLoading(false);
  }

  async function handleSignOutOthers() {
    try {
      await supabase.auth.signOut({ scope: 'others' });
      toast.success('Signed out of other sessions');
      loadDevices();
    } catch (e: any) {
      toast.error('Failed to sign out of other sessions');
    }
  }

  async function handleRevokeDevice(id: string) {
    try {
      await supabase.from('user_devices').delete().eq('id', id);
      setDevices(prev => prev.filter(d => d.id !== id));
      toast.success('Device revoked');
    } catch {
      toast.error('Failed to revoke device');
    }
  }

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-surface rounded-[16px] w-full max-w-md overflow-hidden border border-border-subtle shadow-xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-text-main">Manage Sessions</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-sec dark:hover:text-text-muted"><X size={20}/></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div>
          ) : (
            <div className="space-y-3">
              {devices.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-[12px] border border-gray-100 dark:border-[#1F2937]">
                  <div>
                    <p className="text-[12px] font-medium text-text-main">{d.device_name || 'Unknown Device'}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">Last seen: {new Date(d.last_seen_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleRevokeDevice(d.id)} className="text-[11px] text-red-500 hover:text-red-600 font-medium px-2 py-1 bg-red-50 dark:bg-red-500/10 rounded">Revoke</button>
                </div>
              ))}
              {devices.length === 0 && <p className="text-[13px] text-text-muted text-center py-4">No active devices found.</p>}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border-subtle bg-bg-secondary flex-shrink-0">
          <button onClick={handleSignOutOthers} className="w-full py-2.5 text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-[10px] transition-colors">
            Sign out all other sessions
          </button>
        </div>
      </div>
    </div>
  );
}


export default function SettingsPage() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

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
  const [editingField, setEditingField] = useState<any>(null);
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
        setActiveSection(section as SettingsSection);
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
  }, [profile, editingField]);

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
      setEditingField(null);
      
      
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
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <Loader2 size={32} strokeWidth={1.75} className="animate-spin text-brand" />
      </div>
    );
  }

  const mainSections = [
    { id: 'appearance', label: 'Appearance', icon: Palette, colorClass: 'bg-brand/10 text-brand dark:bg-[#A78BFA]/10 dark:text-brand', status: null },
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
    <div className="flex items-center gap-4 py-4 md:py-6 ">
      <button onClick={() => setActiveSection('main')} className="p-1 -ml-1 text-text-sec hover:bg-[#EAECF0]/50 dark:hover:bg-[rgba(255,255,255,0.04)] rounded-full transition-colors outline-none">
        <ArrowLeft size={20} strokeWidth={1.75} />
      </button>
      <h2 className="text-[18px] font-semibold text-text-main">{title}</h2>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-y-auto no-scrollbar items-center relative">
      <div className="w-full max-w-[680px] flex flex-col min-h-full px-4 md:px-6">
        
        {/* MAIN OVERVIEW */}
        {activeSection === 'main' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-150 py-6">
            <h1 className="text-[22px] font-bold text-text-main mb-6">Settings</h1>

            {/* Compact Profile Header */}
            <div className="flex items-center gap-4 bg-bg-surface rounded-[10px] border border-border-subtle h-[68px] px-4 mb-6 cursor-pointer hover:bg-bg-secondary transition-colors" onClick={() => setActiveSection("account")}>
              <UserAvatar src={profile.avatar_url} name={profile.display_name} size="xl" className="w-[48px] h-[48px]" isOnline={true} />
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-[600] text-text-main truncate">{profile.display_name}</h2>
                <p className="text-[12px] text-text-sec truncate">@{profile.username}</p>
              </div>
              <ChevronRight size={16} strokeWidth={1.75} className="text-text-sec" />
            </div>

            {/* Compact Lists */}
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2">Preferences</h3>
                <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full">
                  {mainSections.map((item, index) => (
                    <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={cn("flex items-center justify-between w-full px-4 h-[52px] hover:bg-bg-secondary transition-colors outline-none group", index !== mainSections.length - 1 && "border-b border-border-subtle")}>
                      <div className="flex items-center gap-3">
                        <item.icon size={18} strokeWidth={1.75} className="text-text-sec group-hover:text-text-main dark:group-hover:text-text-main transition-colors" />
                        <span className="text-[14px] font-[600] text-text-main">{item.label}</span>
                      </div>
                      <ChevronRight size={15} strokeWidth={1.75} className="text-text-main dark:text-[#475467] group-hover:text-text-sec dark:group-hover:text-text-sec transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2">More</h3>
                <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full">
                  {secondarySections.map((item, index) => (
                    <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={cn("flex items-center justify-between w-full px-4 h-[52px] hover:bg-bg-secondary transition-colors outline-none group", index !== secondarySections.length - 1 && "border-b border-border-subtle")}>
                      <div className="flex items-center gap-3">
                        <item.icon size={18} strokeWidth={1.75} className="text-text-sec group-hover:text-text-main dark:group-hover:text-text-main transition-colors" />
                        <span className="text-[14px] font-[600] text-text-main">{item.label}</span>
                      </div>
                      <ChevronRight size={15} strokeWidth={1.75} className="text-text-main dark:text-[#475467] group-hover:text-text-sec dark:group-hover:text-text-sec transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT SETTINGS */}
        {activeSection === 'account' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-150">
            <BackHeader title="Account" />
            
                        <div className="flex flex-col items-center justify-center py-6 mb-2">
              <div className="relative group cursor-pointer" onClick={() => setShowPhotoEditor(true)}>
                <UserAvatar src={profile.avatar_url} name={profile.display_name} size="2xl" className="w-[72px] h-[72px] shadow-sm" />
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-bg-surface border border-border-subtle rounded-full flex items-center justify-center shadow-sm text-text-sec group-hover:text-brand transition-colors">
                  <Camera size={14} strokeWidth={2} />
                </div>
              </div>
            </div>

            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full mb-6">
               <div className="flex flex-col">
                 <button onClick={() => setEditingField("display_name")} className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors group outline-none">
                   <div className="flex flex-col text-left">
                     <span className="text-[12px] text-text-sec mb-0.5">Display name</span>
                     <span className="text-[14px] font-[600] text-text-main">{profile.display_name}</span>
                   </div>
                   <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                 </button>
                 
                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                 
                 <button onClick={() => setEditingField("username")} className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors group outline-none">
                   <div className="flex flex-col text-left">
                     <span className="text-[12px] text-text-sec mb-0.5">Username</span>
                     <span className="text-[14px] font-[600] text-text-main">@{profile.username}</span>
                   </div>
                   <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                 </button>

                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                 
                 <div className="flex items-center justify-between p-3">
                   <div className="flex flex-col">
                     <span className="text-[12px] text-text-sec mb-0.5">Email</span>
                     <span className="text-[14px] font-[600] text-text-main">{profile.email}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#10B981] dark:text-[#32D583]">
                      <CheckCircle2 size={14} strokeWidth={1.75} /> Verified
                   </div>
                 </div>

                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                 
                 <button onClick={() => setEditingField("bio")} className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors group outline-none">
                   <div className="flex flex-col text-left">
                     <span className="text-[12px] text-text-sec mb-0.5">About</span>
                     <span className="text-[14px] font-[600] text-text-main truncate max-w-[220px]">{profile.bio || 'No bio provided'}</span>
                   </div>
                   <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                 </button>
               </div>
            </div>

            <div className="mt-8">
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full h-[48px] bg-bg-surface border border-border-subtle text-text-main rounded-[12px] text-[14px] font-medium hover:bg-bg-secondary transition-colors shadow-sm">
                <LogOut size={16} strokeWidth={1.75} /> Sign out
              </button>
            </div>
            
            <div className="mt-6">
               <button className="flex items-center justify-center gap-2 w-full h-[48px] border border-[#F97066]/20 bg-[#FEF3F2]/50 dark:bg-[#7A271A]/10 text-[#D92D20] rounded-[12px] text-[14px] font-medium hover:bg-[#FEF3F2] dark:hover:bg-[#F97066]/10 transition-colors">
                  Delete account
               </button>
            </div>
          </div>
        )}

        {/* APPEARANCE */}
        {activeSection === 'appearance' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="flex items-center gap-4 py-4 md:py-6 ">
              <button onClick={() => setActiveSection('main')} className="p-1 -ml-1 text-text-sec hover:bg-[#EAECF0]/50 dark:hover:bg-[rgba(255,255,255,0.04)] rounded-full transition-colors outline-none">
                <ArrowLeft size={20} strokeWidth={1.75} />
              </button>
              <h2 className="text-[18px] font-semibold text-text-main">Appearance</h2>
            </div>
            
            <h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2 w-full mt-6">Theme</h3>
            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full mb-6 p-2">
              <div className="flex bg-bg-primary rounded-[12px] p-1 border border-border-subtle">
                 {[
                   { id: 'light', icon: Sun, label: 'Light' },
                   { id: 'dark', icon: Moon, label: 'Dark' },
                   { id: 'system', icon: Monitor, label: 'System' },
                 ].map((t) => (
                   <button key={t.id} onClick={() => setTheme(t.id)} className={cn('flex-1 flex items-center justify-center gap-2 h-[40px] rounded-[10px] transition-all outline-none', theme === t.id ? 'bg-brand/10 text-brand rounded-[10px] shadow-none border-none' : 'text-text-sec hover:text-text-main dark:hover:text-text-main')}>
                     <t.icon size={16} strokeWidth={1.75} />
                     <span className="text-[12px] font-medium">{t.label}</span>
                   </button>
                 ))}
               </div>
            </div>

            <h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2 w-full">Chat Appearance</h3>
            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full mb-6">
              <div className="flex flex-col">
                <button onClick={() => setShowThemePicker(true)} className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors w-full text-left outline-none group">
                  <span className="text-[14px] font-[600] text-text-main">Chat theme</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-sec capitalize">{globalTheme.themeId === 'connect-purple' ? 'Purple' : globalTheme.themeId}</span>
                    <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                  </div>
                </button>
                <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                <button onClick={() => setShowThemePicker(true)} className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors w-full text-left outline-none group">
                  <span className="text-[14px] font-[600] text-text-main">Chat background</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-sec capitalize">{globalTheme.backgroundId}</span>
                    <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                  </div>
                </button>
                <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                <button onClick={() => setShowThemePicker(true)} className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors w-full text-left outline-none group">
                  <span className="text-[14px] font-[600] text-text-main">Message bubbles</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-sec capitalize">{globalTheme.accentColor}</span>
                    <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                  </div>
                </button>
              </div>
            </div>
            
            {showThemePicker && <ChatThemePicker onClose={() => setShowThemePicker(false)} />}
          </div>
        )}

        {/* PRIVACY */}
        {activeSection === 'privacy' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-150">
            <BackHeader title="Privacy" />
            
            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full mb-6">
               <div className="flex flex-col">
                  {[
                    { key: 'show_online_status', label: 'Last seen', value: localSettings.show_online_status || 'everyone' },
                    { key: 'profile_visibility', label: 'Profile visibility', value: localSettings.profile_visibility || 'everyone' }
                  ].map((item, i) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors group">
                        <span className="text-[14px] font-[600] text-text-main">{item.label}</span>
                        <div className="flex items-center gap-2">
                           <select
                             value={item.value}
                             onChange={e => {
                               setLocalSettings({ ...localSettings, [item.key]: e.target.value });
                               handleSaveSettings();
                             }}
                             className="appearance-none bg-transparent text-[13px] text-text-sec outline-none cursor-pointer text-right"
                           >
                             <option value="everyone">Everyone</option>
                             <option value="contacts">My Contacts</option>
                             <option value="nobody">Nobody</option>
                           </select>
                           <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec pointer-events-none" />
                        </div>
                      </div>
                      <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                    </div>
                  ))}

                  <div className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors">
                    <span className="text-[14px] font-[600] text-text-main">Read receipts</span>
                    <label className="relative inline-flex items-center cursor-pointer mr-2">
                      <input 
                        type="checkbox" className="sr-only peer" 
                        checked={localSettings.read_receipts ?? true}
                        onChange={e => {
                          setLocalSettings({ ...localSettings, read_receipts: e.target.checked });
                          handleSaveSettings();
                        }}
                      />
                      <div className="w-[36px] h-[20px] bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg-surface after:border-border-subtle after:border after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>
                  
                  <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />

                  <button className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors group outline-none">
                    <span className="text-[14px] font-[600] text-text-main">Blocked users</span>
                    <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeSection === 'notifications' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="flex items-center gap-4 py-4 md:py-6 ">
              <button onClick={() => setActiveSection('main')} className="p-1 -ml-1 text-text-sec hover:bg-[#EAECF0]/50 dark:hover:bg-[rgba(255,255,255,0.04)] rounded-full transition-colors outline-none">
                <ArrowLeft size={20} strokeWidth={1.75} />
              </button>
              <div>
                <h2 className="text-[18px] font-semibold text-text-main">Notifications</h2>
                <p className="text-[13px] text-text-sec">Choose how connectX keeps you informed.</p>
              </div>
            </div>
            
            {/* 1. MESSAGE NOTIFICATIONS */}
            <h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2 w-full mt-6">Message Notifications</h3>
            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full mb-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} strokeWidth={1.75} className="text-text-sec" />
                    <span className="text-[14px] font-[600] text-text-main">Messages</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" className="sr-only peer" 
                      checked={(localSettings as any)['message_notifications'] ?? true}
                      onChange={e => {
                        setLocalSettings({ ...localSettings, message_notifications: e.target.checked });
                        handleSaveSettings();
                      }}
                    />
                    <div className="w-[36px] h-[20px] bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg-surface after:border-border-subtle after:border after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-brand"></div>
                  </label>
                </div>
                
                <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                
                <div className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <AtSign size={18} strokeWidth={1.75} className="text-text-sec" />
                    <span className="text-[14px] font-[600] text-text-main">Group notifications</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" className="sr-only peer" 
                      checked={(localSettings as any)['group_notifications'] ?? true}
                      onChange={e => {
                        setLocalSettings({ ...localSettings, group_notifications: e.target.checked });
                        handleSaveSettings();
                      }}
                    />
                    <div className="w-[36px] h-[20px] bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg-surface after:border-border-subtle after:border after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-brand"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. SOUND & VIBRATION */}
            <h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2 w-full">Sound & Vibration</h3>
            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full mb-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell size={18} strokeWidth={1.75} className="text-text-sec" />
                    <span className="text-[14px] font-[600] text-text-main">Notification sound</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" className="sr-only peer" 
                      checked={(localSettings as any)['notification_sound'] ?? true}
                      onChange={e => {
                        setLocalSettings({ ...localSettings, notification_sound: e.target.checked });
                        handleSaveSettings();
                      }}
                    />
                    <div className="w-[36px] h-[20px] bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg-surface after:border-border-subtle after:border after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-brand"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. IN-APP NOTIFICATIONS */}
            <h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2 w-full">In-App Notifications</h3>
            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full">
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} strokeWidth={1.75} className="text-text-sec" />
                    <span className="text-[14px] font-[600] text-text-main">Show notifications while using connectX</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" className="sr-only peer" 
                      checked={(localSettings as any)['notifications_enabled'] ?? true}
                      onChange={e => {
                        setLocalSettings({ ...localSettings, notifications_enabled: e.target.checked });
                        handleSaveSettings();
                      }}
                    />
                    <div className="w-[36px] h-[20px] bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg-surface after:border-border-subtle after:border after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-brand"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SECURITY */}
        {activeSection === 'security' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-150">
            <BackHeader title="Security" />
            
            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full mb-6">
               <div className="flex flex-col">
                 <div className="flex items-center justify-between p-3">
                   <span className="text-[14px] font-[600] text-text-main">Email verification</span>
                   <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#10B981] dark:text-[#32D583]">
                      <CheckCircle2 size={14} strokeWidth={1.75} /> Verified
                   </div>
                 </div>
                 
                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                 
                 <div className="flex items-center justify-between p-3">
                   <span className="text-[14px] font-[600] text-text-main">End-to-end encryption</span>
                   <div className="flex items-center gap-1.5 text-[12px] font-medium text-brand">
                      <CheckCircle2 size={14} strokeWidth={1.75} /> Active
                   </div>
                 </div>

                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                 
                 <button onClick={() => setShowPasswordModal(true)} className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors group outline-none">
                     <span className="text-[14px] font-[600] text-text-main">Change password</span>
                   <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                 </button>

                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />
                 
                 <button onClick={() => setShowSessionsModal(true)} className="flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary transition-colors group outline-none">
                     <span className="text-[14px] font-[600] text-text-main">Manage sessions</span>
                   <ChevronRight size={15} strokeWidth={1.75} className="text-text-sec group-hover:text-text-sec dark:group-hover:text-text-main" />
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* HELP & ABOUT */}
        {(activeSection === 'help' || activeSection === 'about') && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-150">
            <BackHeader title={activeSection === 'help' ? 'Help' : 'About'} />
            
            <div className="bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden w-full mb-6 p-6 flex flex-col items-center justify-center min-h-[200px]">
               {activeSection === 'about' ? (
                 <>
                   <div className="w-12 h-12 bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] rounded-[14px] flex items-center justify-center text-white font-bold text-[20px] mb-4 shadow-sm">
                     cX
                   </div>
                   <h3 className="text-[16px] font-semibold text-text-main">connectX</h3>
                   <p className="text-[13px] text-text-sec mt-1">Version 1.0.0</p>
                 </>
               ) : (
                 <p className="text-[14px] text-text-sec text-center">Help centre coming soon.</p>
               )}
            </div>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/35 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-bg-surface w-full sm:max-w-[440px] rounded-t-[24px] sm:rounded-[24px] shadow-2xl border border-transparent border-border-subtle overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-border-subtle">
              <h2 className="text-[16px] font-semibold text-text-main">
                {editingField === 'display_name' ? 'Edit Display Name' : editingField === 'username' ? 'Edit Username' : 'Edit About'}
              </h2>
              <button onClick={() => setEditingField(null)} className="text-text-sec hover:text-text-main dark:hover:text-text-main transition-colors p-1 rounded-full hover:bg-bg-secondary outline-none">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="flex-1 overflow-y-auto p-5 space-y-5">
              {editingField === 'display_name' && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-text-main">Display Name</label>
                  <div className="relative">
                    <UserRound size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
                    <input
                      type="text" required value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="w-full bg-bg-surface border border-border-subtle rounded-[10px] h-[40px] pl-9 pr-3 text-[14px] text-text-main focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}

              {editingField === 'username' && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-text-main">Username</label>
                  <div className="relative">
                    <AtSign size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
                    <input
                      type="text" required value={editForm.username} onChange={handleUsernameChange}
                      className={cn(
                        "w-full bg-bg-surface border rounded-[10px] h-[40px] pl-9 pr-20 text-[14px] text-text-main focus:outline-none focus:ring-1 transition-all shadow-sm",
                        isUsernameAvailable === false 
                          ? "border-[#F97066] focus:border-[#F97066] focus:ring-[#F97066]" 
                          : "border-border-subtle focus:border-[#8B5CF6] focus:ring-[#8B5CF6]"
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingUsername ? (
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-text-sec">
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
              )}

              {editingField === 'bio' && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-text-main">About</label>
                  <textarea
                    value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-bg-surface border border-border-subtle rounded-[10px] py-2 px-3 text-[14px] text-text-main focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm resize-none"
                    rows={2}
                  />
                </div>
              )}
              
              <div className="pt-2 flex gap-3 mt-6">
                <button type="button" onClick={() => setEditingField(null)} className="flex-1 h-[40px] bg-bg-surface dark:bg-[rgba(255,255,255,0.04)] border border-border-subtle text-text-main rounded-[10px] text-[12px] font-medium hover:bg-bg-secondary transition-colors shadow-sm outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUsernameAvailable === false} className="flex-1 h-[40px] bg-brand text-white rounded-[10px] text-[12px] font-medium hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 outline-none">
                  {isSaving ? <Loader2 size={16} strokeWidth={2} className="animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    
      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <ManageSessionsModal isOpen={showSessionsModal} onClose={() => setShowSessionsModal(false)} />

    
      <div data-testid="connectx-build-debug" className="p-4 text-center text-[11px] text-text-muted font-mono opacity-50">
        CONNECTX_BUILD_DEBUG: 6c1ca4f
      </div>
    </div>
  );
}
