const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// Add useRef lock
if (!code.includes('const isSubmittingRef = useRef(false);')) {
  code = code.replace(
    'const [isSending, setIsSending] = useState(false);',
    'const [isSending, setIsSending] = useState(false);\n    const isSubmittingRef = useRef(false);'
  );
}

// Ensure useRef is imported
if (!code.includes('useRef')) {
  code = code.replace('useState', 'useState, useRef');
}

// Update handleSend to use the ref lock
code = code.replace(
  'if (!profile || isSending) return;',
  'if (!profile || isSending || isSubmittingRef.current) return;\n      isSubmittingRef.current = true;'
);

code = code.replace(
  'setIsSending(false);\n      }',
  'setIsSending(false);\n        isSubmittingRef.current = false;\n      }'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Added strict ref lock');
