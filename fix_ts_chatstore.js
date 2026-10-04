const fs = require('fs');
let code = fs.readFileSync('src/store/useChatStore.ts', 'utf8');

code = code.replace(
  'const map = {}; ids.forEach(id => map[id] = true);',
  'const map: Record<string, boolean> = {}; ids.forEach(id => map[id] = true);'
);

fs.writeFileSync('src/store/useChatStore.ts', code);
console.log('useChatStore TS fixed');
