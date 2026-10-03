const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

content = content.replace(
  "currentUserId={profile?.id || ''} onReply={setReplyToMessage} onEdit={handleEdit}",
  "currentUserId={profile?.id || ''} onReply={setReplyToMessage} onForward={setForwardMessage} onEdit={handleEdit}"
);

content = content.replace(
  "<div ref={messagesEndRef} />\r\n    </div>",
  "<div ref={messagesEndRef} />\r\n      {forwardMessage && <ForwardModal message={forwardMessage} onClose={() => setForwardMessage(null)} />}\r\n    </div>"
);

content = content.replace(
  "<div ref={messagesEndRef} />\n    </div>",
  "<div ref={messagesEndRef} />\n      {forwardMessage && <ForwardModal message={forwardMessage} onClose={() => setForwardMessage(null)} />}\n    </div>"
);

fs.writeFileSync('src/components/chat/MessageList.tsx', content);
