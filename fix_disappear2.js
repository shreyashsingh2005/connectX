const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

code = code.replace(
  /return \(\n\s*<div className="flex h-full flex-1 min-w-0 overflow-hidden">/g,
  'if (!conversation) {\n    return (\n      <div className="flex-1 flex items-center justify-center">\n        <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />\n      </div>\n    );\n  }\n\n  return (\n    <div className="flex h-full flex-1 min-w-0 overflow-hidden">'
);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code, 'utf8');
console.log('Fixed return replace');
