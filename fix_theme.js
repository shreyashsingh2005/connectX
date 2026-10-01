const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

if (!code.includes('useTheme')) {
  code = code.replace(
    /import { useE2EE } from '@\/hooks\/useE2EE';/,
    "import { useE2EE } from '@/hooks/useE2EE';\nimport { useTheme } from 'next-themes';"
  );
  
  code = code.replace(
    /const supabase = createClient\(\);/,
    "const supabase = createClient();\n  const { resolvedTheme } = useTheme();"
  );
  
  code = code.replace(
    /theme=\{typeof document !== 'undefined' && document\.documentElement\.classList\.contains\('dark'\) \? Theme\.DARK : Theme\.LIGHT\}/,
    "theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}"
  );
  
  fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
  console.log("Added useTheme to MessageComposer");
}
