const fs = require('fs');
let file = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

file = file.replace(
  /const encrypt = async \(text: string\) => \{/g,
  `const encrypt = useCallback(async (text: string) => {`
);
file = file.replace(
  /return await E2EE\.encryptText\(text, conversationKey\);\n\s*\};/g,
  `return await E2EE.encryptText(text, conversationKey);\n  }, [conversationKey]);`
);

file = file.replace(
  /const decrypt = async \(ciphertext: string\) => \{/g,
  `const decrypt = useCallback(async (ciphertext: string) => {`
);
file = file.replace(
  /return await E2EE\.decryptText\(ciphertext, conversationKey\);\n\s*\};/g,
  `return await E2EE.decryptText(ciphertext, conversationKey);\n  }, [conversationKey]);`
);

file = file.replace(
  /const encryptAttachment = async \(file: Blob\) => \{/g,
  `const encryptAttachment = useCallback(async (file: Blob) => {`
);
file = file.replace(
  /return await E2EE\.encryptFile\(file, conversationKey\);\n\s*\};/g,
  `return await E2EE.encryptFile(file, conversationKey);\n  }, [conversationKey]);`
);

file = file.replace(
  /const decryptAttachment = async \(file: Blob, mimeType\?: string\) => \{/g,
  `const decryptAttachment = useCallback(async (file: Blob, mimeType?: string) => {`
);
file = file.replace(
  /return await E2EE\.decryptFile\(file, conversationKey, mimeType\);\n\s*\};/g,
  `return await E2EE.decryptFile(file, conversationKey, mimeType);\n  }, [conversationKey]);`
);

if (!file.includes("useCallback")) {
  file = file.replace(/import \{ useState, useEffect \} from 'react';/, `import { useState, useEffect, useCallback } from 'react';`);
} else {
  // ensure useCallback is imported
  if (!file.includes("useCallback")) {
     file = file.replace(/import \{ useState, useEffect/, `import { useState, useEffect, useCallback`);
  }
}

fs.writeFileSync('src/hooks/useE2EE.ts', file);
console.log("Wrapped useE2EE methods in useCallback");
