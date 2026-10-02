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

// Fix chat page
let chatPage = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');
if (!chatPage.includes('const themeColors')) {
  chatPage = chatPage.replace(
    "import { useThemeStore }",
    "import { useThemeStore, ThemeId } from '@/store/useThemeStore';"
  );
  chatPage = chatPage.replace("export default function", `${themeColors}\nexport default function`);
  fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', chatPage, 'utf8');
}

// Fix settings page
let settingsPage = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
settingsPage = settingsPage.replace(/if \(avatarFile\) \{[\s\S]*?\}/g, "");
settingsPage = settingsPage.replace(/const \[avatarFile, setAvatarFile\] = useState<File \| null>\(null\);/g, "");
settingsPage = settingsPage.replace(/const \[avatarPreview, setAvatarPreview\] = useState<string \| null>\(null\);/g, "");
settingsPage = settingsPage.replace(/setAvatarFile\(null\);/g, "");
settingsPage = settingsPage.replace(/setAvatarPreview\(null\);/g, "");
// Fix any straggling avatarFile references
settingsPage = settingsPage.replace(/let avatarUrl = profile.avatar_url;[\s\S]*?avatarUrl = publicUrl;[\s\S]*?\}/g, "let avatarUrl = profile.avatar_url;");
fs.writeFileSync('src/app/(app)/settings/page.tsx', settingsPage, 'utf8');

// Fix ChatThemePicker
let picker = fs.readFileSync('src/components/chat/ChatThemePicker.tsx', 'utf8');
picker = picker.replace(/import \{ ThemeId \} from '@\/store\/useThemeStore';\nimport \{ useThemeStore, ThemePreferences, ThemeId, BackgroundId, AccentColor \} from '@\/store\/useThemeStore';/g, "import { useThemeStore, ThemePreferences, ThemeId, BackgroundId, AccentColor } from '@/store/useThemeStore';");
fs.writeFileSync('src/components/chat/ChatThemePicker.tsx', picker, 'utf8');

console.log('Fixed TS errors');
