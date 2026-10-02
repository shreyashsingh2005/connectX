const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// 1. Add Imports
if (!code.includes('ProfilePhotoEditor')) {
  code = code.replace(
    "import { useRouter } from 'next/navigation';",
    `import { useRouter } from 'next/navigation';
import { ProfilePhotoEditor } from '@/components/profile/ProfilePhotoEditor';
import { useThemeStore } from '@/store/useThemeStore';`
  );
}

// 2. Add State
if (!code.includes('showPhotoEditor')) {
  code = code.replace(
    "const [activeSection, setActiveSection] = useState<SettingsSection>('main');",
    `const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const { globalTheme, setGlobalTheme } = useThemeStore();`
  );
}

// 3. Inject Profile Photo Row into Account Section
const photoRow = `
                 <div className="h-[1px] bg-[#EAECF0] dark:bg-[#252A34] w-[calc(100%-24px)] mx-auto my-1" />
                 <button onClick={() => setShowPhotoEditor(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                   <div className="flex flex-col text-left">
                     <span className="text-[12px] text-[#667085] dark:text-[#98A2B3] mb-0.5">Profile photo</span>
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Change photo</span>
                   </div>
                   <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                 </button>
`;
if (!code.includes('Change photo')) {
  code = code.replace(
    /profile\.bio \|\| 'No bio provided'\}<\/span>\s*<\/div>\s*<ChevronRight[^>]+>\s*<\/button>/,
    match => match + photoRow
  );
}

// 4. Render Photo Editor modal at the bottom
if (!code.includes('<ProfilePhotoEditor')) {
  code = code.replace(
    '      {showAvatarUpload && (',
    `      {showPhotoEditor && (
        <ProfilePhotoEditor
          onClose={() => setShowPhotoEditor(false)}
          onUpdate={(newUrl) => {
             // DP updated!
          }}
        />
      )}
      {showAvatarUpload && (`
  );
}

// 5. Replace Appearance Section
const newAppearance = `
          {activeSection === 'appearance' && (
            <div className="flex-1 flex flex-col pb-10 animate-in fade-in slide-in-from-right-4 duration-200">
              <BackHeader title="Appearance" />
              
              <div className="px-4 md:px-0 mt-2 space-y-4">
                
                {/* Theme Mode */}
                <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] p-4 shadow-sm">
                  <p className="text-[13px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-4">Display Mode</p>
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

                {/* Theme Selector */}
                <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] font-semibold text-[#101828] dark:text-[#F5F7FA]">Chat Theme</p>
                  </div>
                  
                  {/* LIVE PREVIEW */}
                  <div className="mb-6 rounded-[16px] overflow-hidden border border-[#EAECF0] dark:border-[#252A34] h-[180px] relative flex flex-col justify-end p-4"
                    style={{
                      backgroundColor: globalTheme.backgroundId === 'solid' 
                        ? (theme === 'dark' ? '#0B0D12' : '#FBFBFD') 
                        : (theme === 'dark' ? '#11141A' : '#F7F8FC'),
                      backgroundImage: globalTheme.backgroundId !== 'solid' ? \`url('/patterns/\${globalTheme.backgroundId}.svg')\` : undefined,
                      opacity: 1 // We would control intensity in a real CSS var injection
                    }}
                  >
                    <div className="flex items-end gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#252A34] flex-shrink-0" />
                      <div className="max-w-[70%] px-3 py-2 text-[12px] rounded-[14px] rounded-bl-[4px] bg-[#FFFFFF] dark:bg-[#171B23] text-[#101828] dark:text-[#F5F7FA] shadow-sm">
                        Hey! Have you seen the new theme? 👋
                      </div>
                    </div>
                    <div className="flex items-end justify-end gap-2">
                      <div className="max-w-[70%] px-3 py-2 text-[12px] rounded-[14px] rounded-br-[4px] text-white shadow-sm"
                        style={{ backgroundColor: globalTheme.accentColor === 'purple' ? '#8B5CF6' : globalTheme.accentColor === 'blue' ? '#3B82F6' : globalTheme.accentColor === 'pink' ? '#EC4899' : globalTheme.accentColor === 'green' ? '#10B981' : '#F97316' }}
                      >
                        Yeah, it looks absolutely stunning! ✨
                      </div>
                    </div>
                  </div>

                  {/* Accents */}
                  <p className="text-[12px] font-medium text-[#667085] dark:text-[#98A2B3] mb-3">Accent Color</p>
                  <div className="flex gap-3 mb-6">
                    {['purple', 'blue', 'pink', 'green', 'orange'].map(c => (
                      <button key={c} onClick={() => setGlobalTheme({ accentColor: c as any })}
                        className={cn("w-8 h-8 rounded-full border-2 transition-transform hover:scale-110", globalTheme.accentColor === c ? "border-[#101828] dark:border-white scale-110" : "border-transparent")}
                        style={{ backgroundColor: c === 'purple' ? '#8B5CF6' : c === 'blue' ? '#3B82F6' : c === 'pink' ? '#EC4899' : c === 'green' ? '#10B981' : '#F97316' }}
                      />
                    ))}
                  </div>
                  
                  {/* Themes / Backgrounds */}
                  <p className="text-[12px] font-medium text-[#667085] dark:text-[#98A2B3] mb-3">Chat Background</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'solid', name: 'Solid' },
                      { id: 'dots', name: 'Dots' },
                      { id: 'circles', name: 'Circles' },
                      { id: 'waves', name: 'Waves' },
                      { id: 'grid', name: 'Grid' },
                      { id: 'aurora-lines', name: 'Aurora' }
                    ].map(bg => (
                      <button key={bg.id} onClick={() => setGlobalTheme({ backgroundId: bg.id as any })}
                        className={cn("flex flex-col items-center justify-center p-3 rounded-[12px] border transition-colors", globalTheme.backgroundId === bg.id ? "border-[#8B5CF6] bg-[#8B5CF6]/5" : "border-[#EAECF0] dark:border-[#252A34] hover:bg-gray-50 dark:hover:bg-[#151922]")}
                      >
                        <span className="text-[12px] font-medium text-[#101828] dark:text-[#F5F7FA]">{bg.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#EAECF0] dark:border-[#252A34]">
                    <button onClick={() => setGlobalTheme({ themeId: 'connect-purple', backgroundId: 'solid', accentColor: 'purple' })} className="text-[13px] font-medium text-[#F04438] hover:text-[#D92D20]">
                      Reset to defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
`;
const oldAppearanceRegex = /\{activeSection === 'appearance' && \([\s\S]*?(?=\{\/\* PRIVACY \*\/)/;
code = code.replace(oldAppearanceRegex, newAppearance + '\n          ');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log("Updated settings page");
