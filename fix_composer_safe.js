const fs = require('fs');

let composer = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

composer = composer.replace(
  /<div className="relative mx-3 mb-2 mt-2" style=\{\{ paddingBottom: "max\(0\.5rem, env\(safe-area-inset-bottom\)\)" \}\}>/,
  '<div className="relative mx-3 mt-2" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', composer);
console.log('Fixed MessageComposer bottom spacing');
