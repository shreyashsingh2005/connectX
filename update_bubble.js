const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

content = content.replace(/import \{([^\}]+)\} from 'lucide-react';/, (match, p1) => {
  if (!p1.includes('AlertCircle')) {
    return \import {\, AlertCircle} from 'lucide-react';\;
  }
  return match;
});

content = content.replace(
  /if \(status === 'read'\) return <CheckCheck className=\"w-\[14px\] h-\[14px\] text-blue-400 drop-shadow-sm\" \/>;\s+return null;/,
  \if (status === 'read') return <CheckCheck className="w-[14px] h-[14px] text-blue-400 drop-shadow-sm" />;
  if (status === 'failed') return <AlertCircle className="w-[14px] h-[14px] text-red-300 drop-shadow-sm" title="Failed to send" />;
  return null;\
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
