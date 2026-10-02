const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

if (!code.includes('ChatThemePicker')) {
  code = code.replace(
    "import { ProfilePhotoEditor } from '@/components/profile/ProfilePhotoEditor';",
    "import { ProfilePhotoEditor } from '@/components/profile/ProfilePhotoEditor';\nimport { ChatThemePicker } from '@/components/chat/ChatThemePicker';"
  );
}

if (!code.includes('showThemePicker')) {
  code = code.replace(
    "const [showPhotoEditor, setShowPhotoEditor] = useState(false);",
    "const [showPhotoEditor, setShowPhotoEditor] = useState(false);\n  const [showThemePicker, setShowThemePicker] = useState(false);"
  );
}

const compactAppearance = `
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
`;

const oldAppearanceRegex = /\{activeSection === 'appearance' && \([\s\S]*?(?=\{\/\* PRIVACY \*\/)/;
code = code.replace(oldAppearanceRegex, compactAppearance + '\n          ');

// Inject the modal at the bottom
if (!code.includes('<ChatThemePicker')) {
  code = code.replace(
    "{showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}",
    "{showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}\n      {showThemePicker && <ChatThemePicker onClose={() => setShowThemePicker(false)} />}"
  );
}

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log("Updated settings page to use compact appearance UI and ChatThemePicker");
