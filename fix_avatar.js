const fs = require('fs');
let code = fs.readFileSync('src/components/ui/UserAvatar.tsx', 'utf8');

if (!code.includes('useState')) {
  code = code.replace(
    /import Image from 'next\/image';/,
    "import Image from 'next/image';\nimport { useState } from 'react';"
  );
  
  code = code.replace(
    /export function UserAvatar\(\{ src, name, size = 'md', isOnline, className \}: UserAvatarProps\) \{/,
    "export function UserAvatar({ src, name, size = 'md', isOnline, className }: UserAvatarProps) {\n  const [imgError, setImgError] = useState(false);\n  \n  // Reset error if src changes\n  import('react').then(react => react.useEffect(() => setImgError(false), [src]));"
  );
  // Actually useEffect can't be imported dynamically safely here inside body. Better to add useEffect to the react import.
  
  code = code.replace(
    /import \{ useState \} from 'react';/,
    "import { useState, useEffect } from 'react';"
  );
  
  code = code.replace(
    /\/\/ Reset error if src changes\n  import\('react'\)\.then\(react => react\.useEffect\(\(\) => setImgError\(false\), \[src\]\)\);/,
    "useEffect(() => setImgError(false), [src]);"
  );
  
  code = code.replace(
    /\{src \? \(/,
    "{src && !imgError ? ("
  );
  
  code = code.replace(
    /className="rounded-full object-cover shadow-sm"/,
    'className="rounded-full object-cover shadow-sm"\n          onError={() => setImgError(true)}'
  );
  
  // also add brand-tinted background for initials
  code = code.replace(
    /bg-\[#F8FAFC\] dark:bg-\[#151922\]/,
    'bg-[#8B5CF6]/10 text-[#8B5CF6]'
  );
  
  // make text color purple for initials
  code = code.replace(
    /text-\[#101828\] dark:text-\[#F5F7FA\]/,
    ''
  );
  
  fs.writeFileSync('src/components/ui/UserAvatar.tsx', code, 'utf8');
  console.log("Updated UserAvatar to handle broken images");
}
