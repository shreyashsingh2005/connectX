const fs = require('fs');

const content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

const regex = /\{\/\* APPEARANCE \*\/\}[\s\S]*?(?=\{\/\* PRIVACY \*\/})/;
const match = content.match(regex);

if (match) {
  const replacement = `{/* APPEARANCE */}
        {activeSection === 'appearance' && (
          <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center gap-4 py-4 md:py-6 px-4 md:px-0">
              <button onClick={() => setActiveSection('main')} className="p-1 -ml-1 text-[#667085] dark:text-[#98A2B3] hover:bg-[#EAECF0]/50 dark:hover:bg-[#151922] rounded-full transition-colors outline-none">
                <ArrowLeft size={20} strokeWidth={1.75} />
              </button>
              <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Appearance</h2>
            </div>
            
            <h3 className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-2 px-1 mx-4 md:mx-0 mt-2">Theme</h3>
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[16px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mx-4 md:mx-0 mb-6 p-2">
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

            <h3 className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-2 px-1 mx-4 md:mx-0">Chat Appearance</h3>
            <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[16px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mx-4 md:mx-0 mb-6">
              <div className="flex flex-col">
                <button onClick={() => setShowThemePicker(true)} className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] transition-colors w-full text-left outline-none group">
                  <span className="text-[15px] font-medium text-[#101828] dark:text-[#F5F7FA]">Chat theme</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-[#667085] dark:text-[#98A2B3] capitalize">{globalTheme.themeId === 'connect-purple' ? 'Purple' : globalTheme.themeId}</span>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                  </div>
                </button>
                <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-32px)] mx-auto" />
                <button onClick={() => setShowThemePicker(true)} className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] transition-colors w-full text-left outline-none group">
                  <span className="text-[15px] font-medium text-[#101828] dark:text-[#F5F7FA]">Chat background</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-[#667085] dark:text-[#98A2B3] capitalize">{globalTheme.backgroundId}</span>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                  </div>
                </button>
                <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-32px)] mx-auto" />
                <button onClick={() => setShowThemePicker(true)} className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] transition-colors w-full text-left outline-none group">
                  <span className="text-[15px] font-medium text-[#101828] dark:text-[#F5F7FA]">Message bubbles</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-[#667085] dark:text-[#98A2B3] capitalize">{globalTheme.accentColor}</span>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                  </div>
                </button>
              </div>
            </div>
            
            {showThemePicker && <ChatThemePicker onClose={() => setShowThemePicker(false)} />}
          </div>
        )}

        `;

  const newContent = content.replace(regex, replacement);
  fs.writeFileSync('src/app/(app)/settings/page.tsx', newContent);
  console.log('Replaced Appearance section successfully!');
} else {
  console.log('Match not found!');
}
