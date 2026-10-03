const fs = require('fs');

const content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

const regex = /\{\/\* NOTIFICATIONS \*\/\}[\s\S]*?(?=\{\/\* SECURITY \*\/})/;
const match = content.match(regex);

if (match) {
  const replacement = `{/* NOTIFICATIONS */}
        {activeSection === 'notifications' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center gap-4 py-4 md:py-6 px-4 md:px-0">
              <button onClick={() => setActiveSection('main')} className="p-1 -ml-1 text-[#667085] dark:text-[#98A2B3] hover:bg-[#EAECF0]/50 dark:hover:bg-[#151922] rounded-full transition-colors outline-none">
                <ArrowLeft size={20} strokeWidth={1.75} />
              </button>
              <div>
                <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Notifications</h2>
                <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">Choose how connectX keeps you informed.</p>
              </div>
            </div>
            
            {/* 1. MESSAGE NOTIFICATIONS */}
            <h3 className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-2 px-1 mx-4 md:mx-0 mt-2">Message Notifications</h3>
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[16px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mx-4 md:mx-0 mb-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3]" />
                    <span className="text-[15px] font-medium text-[#101828] dark:text-[#F5F7FA]">Messages</span>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#8B5CF6]"></div>
                  </label>
                </div>
                
                <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-32px)] mx-auto" />
                
                <div className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] transition-colors">
                  <div className="flex items-center gap-3">
                    <AtSign size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3]" />
                    <span className="text-[15px] font-medium text-[#101828] dark:text-[#F5F7FA]">Group notifications</span>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#8B5CF6]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. SOUND & VIBRATION */}
            <h3 className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-2 px-1 mx-4 md:mx-0">Sound & Vibration</h3>
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[16px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mx-4 md:mx-0 mb-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3]" />
                    <span className="text-[15px] font-medium text-[#101828] dark:text-[#F5F7FA]">Notification sound</span>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#8B5CF6]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. IN-APP NOTIFICATIONS */}
            <h3 className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-2 px-1 mx-4 md:mx-0">In-App Notifications</h3>
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[16px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mx-4 md:mx-0">
              <div className="flex flex-col">
                <div className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] transition-colors">
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} strokeWidth={1.75} className="text-[#667085] dark:text-[#98A2B3]" />
                    <span className="text-[15px] font-medium text-[#101828] dark:text-[#F5F7FA]">Show notifications while using connectX</span>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#8B5CF6]"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}

        `;

  const newContent = content.replace(regex, replacement);
  fs.writeFileSync('src/app/(app)/settings/page.tsx', newContent);
  console.log('Replaced successfully!');
} else {
  console.log('Match not found!');
}
