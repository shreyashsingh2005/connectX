const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatThemePicker.tsx', 'utf8');

// Replace corrupted emojis
code = code.replace(/Hey! Have you seen the new theme\? [^\<]*</, 'Hey! Have you seen the new theme? <');
code = code.replace(/Yeah, it looks absolutely stunning! [^\<]*</, 'Yeah, it looks absolutely stunning! <');

// Actually, just remove the corrupted text safely.
const fixed1 = code.replace(/Hey! Have you seen the new theme\? [^<]*?<\/div>/, 'Hey! Have you seen the new theme? </div>');
const fixed2 = fixed1.replace(/Yeah, it looks absolutely stunning! [^<]*?<\/div>/, 'Yeah, it looks absolutely stunning! </div>');

fs.writeFileSync('src/components/chat/ChatThemePicker.tsx', fixed2, 'utf8');
console.log('Fixed corrupted emojis in ChatThemePicker');
