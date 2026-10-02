const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

code = code.replace(
  /if \(e2eeError\) \{\n\s*toast\.error\('E2EE Error: ' \+ e2eeError \+ '\. Cannot send\.'\);\n\s*return;\n\s*\}/,
  `if (e2eeError || !e2eeReady) {
        toast.error('Encryption is still initializing. Please try again.');
        return;
      }`
);

code = code.replace(
  /if \(!e2eeReady\) \{\n\s*toast\.error\('Encryption not ready, please wait\.\.\.'\);\n\s*return;\n\s*\}/,
  ``
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Fixed composer error message');
