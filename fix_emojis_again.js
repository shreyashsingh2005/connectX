const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatThemePicker.tsx', 'utf8');

code = code.replace(
  'Hey! Have you seen the new theme? </div>',
  'Hey! Have you seen the new theme? 👋</div>'
);
code = code.replace(
  'Yeah, it looks absolutely stunning! </div>',
  'Yeah, it looks absolutely stunning! ✨</div>'
);

fs.writeFileSync('src/components/chat/ChatThemePicker.tsx', code, 'utf8');
