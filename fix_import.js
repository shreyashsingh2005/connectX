const fs = require('fs');
let content = fs.readFileSync('src/hooks/useAuth.ts', 'utf8');
content = content.replace(/import\s*\{\s*useState,\s*useEffect,\s*useCallback\s*\}/, "import { useState, useEffect, useCallback, useRef }");
if (!content.includes('useRef')) {
  content = content.replace("import { useEffect, useCallback, useState }", "import { useEffect, useCallback, useState, useRef }");
}
// One more try just matching generic import from react
content = content.replace(/import\s*\{([^}]+)\}\s*from\s*'react'/, (match, p1) => {
  if (!p1.includes('useRef')) return `import {${p1}, useRef} from 'react'`;
  return match;
});
fs.writeFileSync('src/hooks/useAuth.ts', content);
