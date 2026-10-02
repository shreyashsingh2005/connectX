const fs = require('fs');
let code = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

code = code.replace(
  /\} catch \(decryptErr\) \{\n\s*console\.warn\("Failed to decrypt conversation key[^;]*;\n\s*\}/,
  '} catch (decryptErr) {\n              console.error("CRITICAL: Failed to decrypt existing conversation key! DO NOT generate a new one.", decryptErr);\n              throw decryptErr;\n            }'
);

fs.writeFileSync('src/hooks/useE2EE.ts', code, 'utf8');
console.log('Fixed useE2EE to throw instead of generating a new key');
