const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Update lucide-react imports safely
const lucideImportRegex = /import\s+\{[\s\S]*?\}\s+from\s+'lucide-react';/;
const lucideMatch = code.match(lucideImportRegex);

if (lucideMatch) {
  code = code.replace(
    lucideImportRegex,
    `import { 
  Shield, Bell, Eye, Lock, User, ChevronRight, Save, Loader2, 
  Monitor, Moon, Sun, Camera, AtSign, CheckCircle2, Mail, FileText, LogOut, Edit2, KeyRound, Smartphone, Trash2, X
} from 'lucide-react';`
  );
} else {
  console.error("Could not find lucide-react import!");
  process.exit(1);
}

const splitMarker = `  if (!profile) {`;
const parts = code.split(splitMarker);
if (parts.length !== 2) {
  console.error("Could not find split marker!");
  process.exit(1);
}

const newReturn = `  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0D12]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-[#0B0D12] overflow-y-auto no-scrollbar">
      <div className="max-w-[1000px] mx-auto w-full px-4 sm:px-6 md:px-8 py-6 sm:py-10 flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-[28px] font-[650] text-[#101828] dark:text-[#F5F7FA] tracking-tight mb-1">Settings</h1>
          <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Manage your connectX account, security and preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Navigation */}
          <div className="w-full md:w-[240px] flex-shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0 border-b md:border-none border-[#EAECF0] dark:border-[#252A34]">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-[10px] transition-all whitespace-nowrap outline-none',
                  activeSection === id
                    ? 'bg-[#8B5CF6]/10 text-[#6D28D9] dark:text-[#A78BFA] font-medium'
                    : 'text-[#667085] dark:text-[#98A2B3] hover:bg-[#EAECF0]/50 dark:hover:bg-[#151922] hover:text-[#101828] dark:hover:text-[#F5F7FA]'
                )}
              >
                <Icon size={18} className={cn(activeSection === id ? 'text-[#8B5CF6]' : '')} />
                <span className="text-[14px]">{label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 max-w-[640px] pb-12">
            {activeSection === 'account' && (
              <div className="animate-in fade-in duration-200">
                <div className="mb-6">
                  <h2 className="text-[20px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">Account</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Manage your profile and account information.</p>
                </div>
                
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-8 gap-4">
                  <div className="flex items-center gap-5">
                    <UserAvatar src={profile.avatar_url} name={profile.display_name} size="2xl" className="w-[72px] h-[72px]" isOnline={true} />
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA]">{profile.display_name}</h3>
                      <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mb-1">@{profile.username}</p>
                      <div className="flex items-center gap-1.5 text-[13px] text-[#12B76A] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                        Active
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F8FAFC] dark:hover:bg-[#151922] transition-colors rounded-[10px] text-[13px] font-medium shadow-sm w-full sm:w-auto"
                  >
                    <Edit2 size={16} /> Edit Profile
                  </button>
                </div>

                {/* Profile Info List */}
                <div className="bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-8">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-[#EAECF0] dark:border-[#252A34] gap-2">
                     <div>
                       <p className="text-[13px] font-medium text-[#667085] dark:text-[#98A2B3] mb-1">Display name</p>
                       <p className="text-[14px] text-[#101828] dark:text-[#F5F7FA]">{profile.display_name}</p>
                     </div>
                     <button onClick={() => setIsEditingProfile(true)} className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">Edit</button>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-[#EAECF0] dark:border-[#252A34] gap-2">
                     <div>
                       <p className="text-[13px] font-medium text-[#667085] dark:text-[#98A2B3] mb-1">Username</p>
                       <p className="text-[14px] text-[#101828] dark:text-[#F5F7FA]">@{profile.username}</p>
                     </div>
                     <button onClick={() => setIsEditingProfile(true)} className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">Edit</button>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-[#EAECF0] dark:border-[#252A34] gap-2">
                     <div>
                       <p className="text-[13px] font-medium text-[#667085] dark:text-[#98A2B3] mb-1">Email</p>
                       <p className="text-[14px] text-[#101828] dark:text-[#F5F7FA]">{profile.email}</p>
                     </div>
                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#12B76A]/10 text-[#12B76A] rounded-full text-[12px] font-medium self-start sm:self-auto mt-2 sm:mt-0">
                        <CheckCircle2 size={14} /> Verified
                     </div>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-2">
                     <div>
                       <p className="text-[13px] font-medium text-[#667085] dark:text-[#98A2B3] mb-1">About</p>
                       <p className="text-[14px] text-[#101828] dark:text-[#F5F7FA]">{profile.bio || 'No bio provided'}</p>
                     </div>
                     <button onClick={() => setIsEditingProfile(true)} className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">{profile.bio ? 'Edit' : 'Add'}</button>
                   </div>
                </div>
                
                {/* Account Status */}
                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-4">Account status</h3>
                <div className="bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-10">
                   <div className="flex items-center gap-4 p-5 border-b border-[#EAECF0] dark:border-[#252A34]">
                     <div className="w-10 h-10 rounded-full bg-[#12B76A]/10 flex flex-shrink-0 items-center justify-center text-[#12B76A]">
                       <Mail size={18} />
                     </div>
                     <div>
                       <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Email verification</p>
                       <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">Verified</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 p-5 border-b border-[#EAECF0] dark:border-[#252A34]">
                     <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex flex-shrink-0 items-center justify-center text-[#8B5CF6]">
                       <Shield size={18} />
                     </div>
                     <div>
                       <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Encryption</p>
                       <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">End-to-end encrypted</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 p-5">
                     <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex flex-shrink-0 items-center justify-center text-[#8B5CF6]">
                       <Monitor size={18} />
                     </div>
                     <div>
                       <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Session</p>
                       <p className="text-[13px] text-[#12B76A] font-medium">Active</p>
                     </div>
                   </div>
                </div>

                {/* Danger Zone */}
                <h3 className="text-[14px] font-semibold text-[#D92D20] mb-4">Danger zone</h3>
                <div className="border border-[#F04438]/20 bg-[#FEF3F2]/50 dark:bg-[#7A271A]/10 rounded-[16px] p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Delete account</p>
                      <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1">Permanently delete your account and all data. This action cannot be undone.</p>
                    </div>
                    <button className="px-4 py-2.5 bg-white dark:bg-[#11141A] border border-[#F04438]/30 text-[#D92D20] rounded-[10px] text-[13px] font-medium hover:bg-[#FEF3F2] dark:hover:bg-[#F04438]/10 transition-colors whitespace-nowrap">
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="animate-in fade-in duration-200">
                <div className="mb-6">
                  <h2 className="text-[20px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">Appearance</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Customize how connectX looks.</p>
                </div>
                
                <h3 className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA] mb-4">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'system', icon: Monitor, label: 'System' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 h-[96px] rounded-[12px] border transition-colors shadow-sm',
                        theme === t.id
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/5 text-[#8B5CF6]'
                          : 'border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#11141A] text-[#667085] dark:text-[#98A2B3] hover:border-[#8B5CF6]/50 hover:bg-[#F8FAFC] dark:hover:bg-[#151922]'
                      )}
                    >
                      <t.icon size={24} className={theme === t.id ? 'text-[#8B5CF6]' : ''} />
                      <span className="text-[13px] font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="animate-in fade-in duration-200">
                <div className="mb-6">
                  <h2 className="text-[20px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">Privacy</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Control who can interact with you.</p>
                </div>
                
                <div className="bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] shadow-sm">
                  {[
                    { key: 'show_online_status', label: 'Online Status', desc: 'Who can see when you are online' },
                    { key: 'show_last_seen', label: 'Last Seen', desc: 'Who can see your last seen time' },
                    { key: 'profile_visibility', label: 'Profile Visibility', desc: 'Who can view your profile' },
                  ].map((item, i) => (
                    <div key={item.key} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4", i !== 0 && "border-t border-[#EAECF0] dark:border-[#252A34]")}>
                      <div>
                        <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</p>
                        <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">{item.desc}</p>
                      </div>
                      <select
                        value={localSettings[item.key as keyof UserSettings] as string || 'everyone'}
                        onChange={e => setLocalSettings({ ...localSettings, [item.key]: e.target.value })}
                        className="bg-[#F8FAFC] dark:bg-[#0B0D12] border border-[#EAECF0] dark:border-[#252A34] text-[#101828] dark:text-[#F5F7FA] text-[13px] rounded-[8px] px-3 py-2 outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] min-w-[140px]"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Contacts</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                  ))}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-t border-[#EAECF0] dark:border-[#252A34] gap-4">
                    <div>
                      <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Read Receipts</p>
                      <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">Let others know when you've read their messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" className="sr-only peer" 
                        checked={localSettings.read_receipts ?? true}
                        onChange={e => setLocalSettings({ ...localSettings, read_receipts: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                   <button className="px-5 py-2.5 bg-[#8B5CF6] text-white text-[13px] font-medium rounded-[10px] hover:bg-[#7C3AED] transition-all shadow-sm">
                     Save changes
                   </button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="animate-in fade-in duration-200">
                <div className="mb-6">
                  <h2 className="text-[20px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">Notifications</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Control how connectX alerts you.</p>
                </div>
                
                <div className="bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] shadow-sm">
                  {[
                    { key: 'notifications_enabled', label: 'Push Notifications', desc: 'Enable all push notifications' },
                    { key: 'message_notifications', label: 'Direct Messages', desc: 'Notify me when I receive a DM' },
                    { key: 'group_notifications', label: 'Group Messages', desc: 'Notify me about group activity' },
                    { key: 'notification_sound', label: 'Notification Sounds', desc: 'Play a sound for new notifications' },
                  ].map((item, i) => (
                    <div key={item.key} className={cn("flex items-center justify-between p-5 gap-4", i !== 0 && "border-t border-[#EAECF0] dark:border-[#252A34]")}>
                      <div>
                        <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</p>
                        <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" className="sr-only peer" 
                          checked={(localSettings as any)[item.key] ?? true}
                          onChange={e => setLocalSettings({ ...localSettings, [item.key]: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                   <button className="px-5 py-2.5 bg-[#8B5CF6] text-white text-[13px] font-medium rounded-[10px] hover:bg-[#7C3AED] transition-all shadow-sm">
                     Save changes
                   </button>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="animate-in fade-in duration-200">
                <div className="mb-6">
                  <h2 className="text-[20px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">Security</h2>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Protect your account and manage your sessions.</p>
                </div>
                
                <div className="bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-6">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-[#EAECF0] dark:border-[#252A34] gap-4">
                     <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-full bg-[#F8FAFC] dark:bg-[#151922] flex items-center justify-center text-[#667085] dark:text-[#98A2B3] flex-shrink-0">
                         <KeyRound size={18} />
                       </div>
                       <div>
                         <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Password</p>
                         <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">Last changed recently</p>
                       </div>
                     </div>
                     <button className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 self-start sm:self-auto ml-14 sm:ml-0">
                       Change <ChevronRight size={14} />
                     </button>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                     <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-full bg-[#F8FAFC] dark:bg-[#151922] flex items-center justify-center text-[#667085] dark:text-[#98A2B3] flex-shrink-0">
                         <Smartphone size={18} />
                       </div>
                       <div>
                         <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Two-factor authentication</p>
                         <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-0.5">Not currently enabled</p>
                       </div>
                     </div>
                     <button className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 self-start sm:self-auto ml-14 sm:ml-0">
                       Enable <ChevronRight size={14} />
                     </button>
                   </div>
                </div>

                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-4">Active sessions</h3>
                <div className="bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm mb-6">
                   <div className="flex items-center justify-between p-5">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] flex-shrink-0">
                         <Monitor size={18} />
                       </div>
                       <div>
                         <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">This device</p>
                         <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">Chrome • Windows</p>
                            <span className="w-1 h-1 rounded-full bg-[#D0D5DD] dark:bg-[#374151]"></span>
                            <span className="text-[12px] text-[#12B76A] font-medium">Active now</span>
                         </div>
                       </div>
                     </div>
                   </div>
                   <div className="p-4 border-t border-[#EAECF0] dark:border-[#252A34] flex justify-center bg-[#F8FAFC] dark:bg-[#0B0D12] rounded-b-[16px]">
                      <button className="text-[13px] font-medium text-[#D92D20] hover:text-[#B42318] transition-colors">
                        Sign out other sessions
                      </button>
                   </div>
                </div>

                <div className="mt-8 border-t border-[#EAECF0] dark:border-[#252A34] pt-8">
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] text-[#101828] dark:text-[#F5F7FA] rounded-[10px] text-[14px] font-medium hover:bg-[#F8FAFC] dark:hover:bg-[#151922] transition-colors shadow-sm">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B10]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#11141A] w-full max-w-[440px] rounded-[20px] shadow-xl border border-[#EAECF0] dark:border-[#252A34] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-[#EAECF0] dark:border-[#252A34]">
              <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Edit profile</h2>
              <button onClick={() => setIsEditingProfile(false)} className="text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer mb-2" onClick={() => fileInputRef.current?.click()}>
                  <UserAvatar src={avatarPreview || profile.avatar_url} name={profile.display_name} size="2xl" className="w-[80px] h-[80px]" />
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white w-6 h-6" />
                  </div>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED]">Change photo</button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#98A2B3]" />
                  <input
                    type="text" required value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0B0D12] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-[10px] pl-9 pr-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#98A2B3]" />
                  <input
                    type="text" required value={editForm.username} onChange={handleUsernameChange}
                    className={cn(
                      "w-full bg-[#F8FAFC] dark:bg-[#0B0D12] border rounded-[10px] py-[10px] pl-9 pr-10 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:ring-1 transition-all shadow-sm",
                      isUsernameAvailable === false 
                        ? "border-[#F04438] focus:border-[#F04438] focus:ring-[#F04438]/50" 
                        : "border-[#EAECF0] dark:border-[#252A34] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/50"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 size={16} className="animate-spin text-[#8B5CF6]" />
                    ) : isUsernameAvailable === false ? (
                      <span className="text-[12px] font-medium text-[#F04438]">Taken</span>
                    ) : isUsernameAvailable === true && editForm.username.length >= 3 && editForm.username !== profile.username ? (
                      <span className="text-[12px] font-medium text-[#12B76A]">Available</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]">About</label>
                <textarea
                  value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0B0D12] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-[10px] px-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 transition-all shadow-sm resize-none"
                  rows={3}
                  placeholder="Tell us a little about yourself"
                />
              </div>
              
              <div className="pt-4 border-t border-[#EAECF0] dark:border-[#252A34] flex gap-3">
                <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 px-4 py-[10px] bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] rounded-[10px] text-[14px] font-medium hover:bg-[#F8FAFC] dark:hover:bg-[#151922] transition-colors shadow-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUsernameAvailable === false} className="flex-1 px-4 py-[10px] bg-[#8B5CF6] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#7C3AED] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
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
`;

const finalCode = parts[0] + newReturn;

fs.writeFileSync('src/app/(app)/settings/page.tsx', finalCode, 'utf8');
console.log("Updated Settings Page UI with correct imports");
