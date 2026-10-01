const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

code = code.replace(
  /return \{ id: msg\.id, changes: \{ decrypted_content: '\[Unable to decrypt message: ' \+ \(e\?\.message \|\| e\?\.name \|\| String\(e\)\) \+ '\]' \} \};/,
  "return { id: msg.id, changes: { decrypted_content: null, decryption_error: true } };"
);

// We should also look at how it renders so we can show the "Unable to decrypt this message" lock screen.
// Wait, MessageList doesn't render the message body itself, MessageBubble does!
fs.writeFileSync('src/components/chat/MessageList.tsx', code, 'utf8');
console.log("Updated MessageList");
