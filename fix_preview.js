
const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');
content = content.replace(/preview: file\.type\.startsWith\('image\/'\) \? URL\.createObjectURL\(file\) : '',/g, 'preview: URL.createObjectURL(file),');
content = content.replace(/preview: '',\n\s*type: 'audio'/g, 'preview: URL.createObjectURL(audioFile),\\n          type: \'audio\'');
fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);

