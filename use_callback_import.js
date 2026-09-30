const fs = require('fs');
let file = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

if (!file.includes("useCallback")) {
  file = file.replace(/import \{ useState, useEffect \} from 'react';/, `import { useState, useEffect, useCallback } from 'react';`);
}
fs.writeFileSync('src/hooks/useE2EE.ts', file);
console.log("Added useCallback import");
