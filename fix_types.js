const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

if (!code.includes('decryption_error?: boolean')) {
  code = code.replace(
    /decrypted_content\?: string \| null;/,
    "decrypted_content?: string | null;\n  decryption_error?: boolean;"
  );
  fs.writeFileSync('src/types/index.ts', code, 'utf8');
  console.log("Updated types/index.ts");
}
