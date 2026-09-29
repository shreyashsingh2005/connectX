const fs = require('fs');
let file = fs.readFileSync('src/types/index.ts', 'utf8');

file = file.replace(
  `  content: string | null;`,
  `  content: string | null;\n  decrypted_content?: string | null;`
);

fs.writeFileSync('src/types/index.ts', file);
