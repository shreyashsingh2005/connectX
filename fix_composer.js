const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// 1. Change handleSend signature
code = code.replace(
  'async function handleSend() {',
  'async function handleSend(e?: React.FormEvent) {\n    e?.preventDefault();'
);

// 2. Wrap return inside a form
code = code.replace(
  /return \(\s*<div\s*className="border border/s,
  'return (\n      <form onSubmit={handleSend}\n        className="border border'
);

// 3. Close the form
code = code.replace(
  /<\/div>\n    \);\n  \}/s,
  '</form>\n    );\n  }'
);

// 4. Change the send button onClick to just be a submit button
code = code.replace(
  /<button type="button" onClick=\{handleSend\}/g,
  '<button type="submit"'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Fixed MessageComposer form');
