const fs = require('fs');

// 1. Inject Theme Debug in chat/[conversationId]/page.tsx
let chatPage = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');
const themeDebugCode = `
  console.log('THEME_RUNTIME_DEBUG:', {
    conversationId,
    globalTheme: useThemeStore.getState().globalTheme,
    chatOverride: useThemeStore.getState().chatOverrides[conversationId],
    effectiveTheme: activeTheme,
    baseColorLight: themeColors[activeTheme.themeId]?.light,
    baseColorDark: themeColors[activeTheme.themeId]?.dark
  });
`;
chatPage = chatPage.replace(
  "const activeTheme = useThemeStore(s => s.getEffectiveTheme(conversationId));",
  "const activeTheme = useThemeStore(s => s.getEffectiveTheme(conversationId));" + themeDebugCode
);
fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', chatPage, 'utf8');

// 2. Inject DP Debug in settings/page.tsx
let settingsPage = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
const dpDebugCode = `
  console.log('PROFILE_RUNTIME_DEBUG:', {
    authUserId: profile?.id,
    profileId: profile?.id,
    avatarUrl: profile?.avatar_url,
    avatarComponentSource: profile?.avatar_url
  });
`;
settingsPage = settingsPage.replace(
  "const [showPhotoEditor, setShowPhotoEditor] = useState(false);",
  "const [showPhotoEditor, setShowPhotoEditor] = useState(false);" + dpDebugCode
);
fs.writeFileSync('src/app/(app)/settings/page.tsx', settingsPage, 'utf8');

// 3. Inject Upload Trace in ProfilePhotoEditor.tsx
let editorPage = fs.readFileSync('src/components/profile/ProfilePhotoEditor.tsx', 'utf8');
editorPage = editorPage.replace(
  "const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {",
  "const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { console.log('DP TRACE: file selected? YES');"
);
editorPage = editorPage.replace(
  "const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));",
  "const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.9)); console.log('DP TRACE: crop created? YES (Blob size:', blob?.size, ')');"
);
editorPage = editorPage.replace(
  "const { data, error } = await supabase.storage",
  "console.log('DP TRACE: starting storage upload to avatars bucket...'); const { data, error } = await supabase.storage"
);
editorPage = editorPage.replace(
  "if (error) throw error;",
  "if (error) { console.error('DP TRACE: storage upload? FAIL', error); throw error; } else { console.log('DP TRACE: storage upload? SUCCESS'); }"
);
editorPage = editorPage.replace(
  "await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);",
  "const dbRes = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id); if (dbRes.error) { console.error('DP TRACE: profiles update? FAIL', dbRes.error); } else { console.log('DP TRACE: profiles update? SUCCESS'); }"
);
fs.writeFileSync('src/components/profile/ProfilePhotoEditor.tsx', editorPage, 'utf8');

console.log('Injected debug statements!');
