const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

file = file.replace(
  /import \{ useE2EE \} from '@\/hooks\/useE2EE';/,
  `import { useE2EE } from '@/hooks/useE2EE';\nimport EmojiPicker, { Theme } from 'emoji-picker-react';`
);

if (!file.includes("showEmojiPicker")) {
  file = file.replace(
    /const \[isRecording, setIsRecording\] = useState\(false\);/,
    `const [isRecording, setIsRecording] = useState(false);\n  const [showEmojiPicker, setShowEmojiPicker] = useState(false);`
  );

  const emojiButtonHtml = `<button
          type="button"
          onClick={() => setShowEmojiPicker(p => !p)}
          className="p-2 text-gray-500 hover:text-pink-500 hover:bg-pink-500/10 rounded-full transition-colors flex-shrink-0 relative"
        >
          <Smile className="w-5 h-5" />
        </button>`;

  // Find the Smile icon button and replace it or just insert if not there
  // Currently we probably have a Paperclip button. Let's see the render section.
}

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Added emoji picker state");
