const fs = require('fs');

let picker = fs.readFileSync('src/components/chat/ChatThemePicker.tsx', 'utf8');

const baseThemeSection = `
          <div>
            <p className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-3">Base Theme</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[
                { id: 'connect-purple', name: 'Default' },
                { id: 'midnight', name: 'Midnight' },
                { id: 'ocean', name: 'Ocean' },
                { id: 'lavender', name: 'Lavender' }
              ].map(theme => (
                <button key={theme.id} onClick={() => updatePreview({ themeId: theme.id as ThemeId })}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-2 rounded-[12px] border transition-all", 
                    previewTheme.themeId === theme.id 
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/5 shadow-sm" 
                      : "border-[#EAECF0] dark:border-[#252A34] hover:bg-gray-50 dark:hover:bg-[#151922]"
                  )}
                >
                  <div className="w-full h-8 rounded-[8px] mb-2 border border-gray-200 dark:border-gray-800" 
                    style={{ backgroundColor: resolvedTheme === 'dark' ? themeColors[theme.id as ThemeId]?.dark : themeColors[theme.id as ThemeId]?.light }} 
                  />
                  <span className={cn("text-[11px] font-medium", previewTheme.themeId === theme.id ? "text-[#8B5CF6]" : "text-[#101828] dark:text-[#F5F7FA]")}>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
`;

if (!picker.includes('Base Theme')) {
  picker = picker.replace(
    '<div>\n            <p className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-3">Accent Color</p>',
    baseThemeSection + '\n          <div>\n            <p className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-3">Accent Color</p>'
  );
  fs.writeFileSync('src/components/chat/ChatThemePicker.tsx', picker, 'utf8');
}
console.log('Added Base Theme selection');
