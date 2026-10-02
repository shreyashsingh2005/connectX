const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Replace any occurrence of fileInputRef.current?.click() with setShowPhotoEditor(true)
code = code.replace(/fileInputRef\.current\?\.click\(\)/g, "setShowPhotoEditor(true)");

// Remove the hidden input element completely
code = code.replace(/<input type="file" ref=\{fileInputRef\}[^>]+>/g, "");

// In UserAvatar inside the form, replace avatarPreview with profile.avatar_url
code = code.replace(/src=\{avatarPreview \|\| profile\.avatar_url\}/g, "src={profile.avatar_url}");

// Remove avatarFile references
code = code.replace(/const \[avatarFile, setAvatarFile\] = useState<File \| null>\(null\);/g, "");
code = code.replace(/const \[avatarPreview, setAvatarPreview\] = useState<string \| null>\(null\);/g, "");

// Remove handleAvatarSelect completely
code = code.replace(/const handleAvatarSelect = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?setAvatarFile\(file\);\n\s*\}\n\s*\};/g, "");

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log('Fixed settings page using robust regex replacement!');
