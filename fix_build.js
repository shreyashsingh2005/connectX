const fs = require('fs');

// 1. Fix ChatHeader.tsx missing cn
let headerCode = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');
if (!headerCode.includes("import { cn }")) {
  headerCode = headerCode.replace(
    /import \{ formatLastSeen \} from '@\/lib\/utils';/,
    "import { formatLastSeen, cn } from '@/lib/utils';"
  );
  fs.writeFileSync('src/components/chat/ChatHeader.tsx', headerCode, 'utf8');
}

// 2. Fix MessageComposer.tsx Smile title
let composerCode = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');
composerCode = composerCode.replace(
  /<Smile size=\{20\} strokeWidth=\{2\} title="Emoji" \/>/,
  '<Smile size={20} strokeWidth={2} />'
);
composerCode = composerCode.replace(
  /onClick=\{\(\) => setShowEmojiPicker\(!showEmojiPicker\)\}/,
  'onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji" aria-label="Emoji"'
);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', composerCode, 'utf8');

console.log("Fixed build errors");
