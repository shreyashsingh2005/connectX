const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

code = code.replace(
  "import { useThemeStore, ThemeId } from '@/store/useThemeStore'; from '@/store/useThemeStore';",
  "import { useThemeStore, ThemeId } from '@/store/useThemeStore';"
);

// I noticed there might be two imports of ThemeId
code = code.replace(
  "import { ThemeId } from '@/store/useThemeStore';\nimport { useThemeStore, ThemeId } from '@/store/useThemeStore';",
  "import { useThemeStore, ThemeId } from '@/store/useThemeStore';"
);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code, 'utf8');
console.log('Fixed syntax error in page.tsx');
