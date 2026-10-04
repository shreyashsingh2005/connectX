const fs = require('fs');

let code = fs.readFileSync('src/components/chat/CallOverlay.tsx', 'utf8');

code = code.replace(/top-safe right-4 top-4/g, 'top-[calc(1rem+env(safe-area-inset-top))] right-4');
code = code.replace(/bottom-safe bottom-8/g, 'bottom-[calc(2rem+env(safe-area-inset-bottom))]');

fs.writeFileSync('src/components/chat/CallOverlay.tsx', code);
console.log('Fixed CallOverlay safe area classes');
