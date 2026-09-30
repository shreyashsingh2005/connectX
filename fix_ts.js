const fs = require('fs');
let useE2EE = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');
useE2EE = useE2EE.replace(
  /import \{ useState, useEffect \} from 'react';/,
  `import { useState, useEffect, useCallback } from 'react';`
);
fs.writeFileSync('src/hooks/useE2EE.ts', useE2EE);

let composer = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');
composer = composer.replace(
  /console.log\("\[E2EE_TRACE\] MessageComposer encryption SUCCESS\. Base64 length:", finalContent\.length\);/,
  `console.log("[E2EE_TRACE] MessageComposer encryption SUCCESS. Base64 length:", finalContent!.length);`
);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', composer);

console.log("Fixed typescript errors");
