const fs = require('fs');

const themeColors = `
const themeColors: Record<ThemeId, { light: string, dark: string }> = {
  'connect-purple': { light: '#FBFBFD', dark: '#0B0D12' },
  'midnight': { light: '#F0F4F8', dark: '#0A101D' },
  'ocean': { light: '#F0F9FF', dark: '#081729' },
  'minimal': { light: '#FFFFFF', dark: '#000000' },
  'amoled': { light: '#FFFFFF', dark: '#000000' },
  'lavender': { light: '#F5F3FF', dark: '#120F1D' },
  'mint': { light: '#ECFDF5', dark: '#061E16' },
  'sunset': { light: '#FFF7ED', dark: '#1E120A' },
  'rose': { light: '#FFF1F2', dark: '#1E0C10' },
  'aurora': { light: '#F0FDF4', dark: '#0A1A12' },
  'graphite': { light: '#F8FAFC', dark: '#0F172A' },
  'soft-sky': { light: '#F0F9FF', dark: '#0B1521' }
};
`;

function injectThemeColors(filePath, activeThemeVar) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Inject themeColors map if it doesn't exist
  if (!code.includes('const themeColors')) {
    code = code.replace(
      "import { useThemeStore",
      "import { ThemeId } from '@/store/useThemeStore';\nimport { useThemeStore"
    );
    
    // insert after imports
    code = code.replace(
      "export function",
      `${themeColors}\nexport function`
    );
  }

  // Replace hardcoded backgroundColor
  const brokenColorRegex = /backgroundColor:\s*[a-zA-Z]+\.backgroundId === 'solid'\s*\?\s*\(resolvedTheme === 'dark' \? '#0B0D12' : '#FBFBFD'\)\s*:\s*\(resolvedTheme === 'dark' \? '#11141A' : '#F7F8FC'\)/g;
  
  if (code.match(brokenColorRegex)) {
    code = code.replace(brokenColorRegex, `backgroundColor: resolvedTheme === 'dark' ? (themeColors[${activeThemeVar}.themeId]?.dark || '#0B0D12') : (themeColors[${activeThemeVar}.themeId]?.light || '#FBFBFD')`);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Injected theme colors into ${filePath}`);
  }
}

injectThemeColors('src/app/(app)/chat/[conversationId]/page.tsx', 'activeTheme');
injectThemeColors('src/components/chat/ChatThemePicker.tsx', 'previewTheme');
