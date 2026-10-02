const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

code = code.replace(
  'className="w-[40px] h-[40px] relative flex-shrink-0"',
  'className="w-[36px] h-[36px] md:w-[42px] md:h-[42px] relative flex-shrink-0"'
);

fs.writeFileSync('src/components/chat/ChatHeader.tsx', code, 'utf8');
console.log('Fixed ChatHeader avatar');
