const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// Update useE2EE import to include error
code = code.replace(
  /const { isReady: e2eeReady, encrypt, encryptAttachment } = useE2EE\(conversationId\);/,
  'const { isReady: e2eeReady, error: e2eeError, encrypt, encryptAttachment } = useE2EE(conversationId);'
);

// Update disabled logic
code = code.replace(
  /disabled={isSending}/,
  'disabled={isSending || (!e2eeReady && !e2eeError)}'
);

// Update button content to show subtle loading if not ready
code = code.replace(
  /\{isSending \? <Loader2 size=\{16\} className="animate-spin" \/> : <Send size=\{16\} className="ml-0\.5" strokeWidth=\{2\} \/>\}/,
  `{isSending || (!e2eeReady && !e2eeError) ? <Loader2 size={16} className="animate-spin opacity-70" /> : <Send size={16} className="ml-0.5" strokeWidth={2} />}`
);

// Update handleSend to handle e2eeError
code = code.replace(
  /if \(!e2eeReady\) \{\n\s*toast\.error\('Encryption not ready, please wait\.\.\.'\);\n\s*return;\n\s*\}/,
  `if (e2eeError) {
      toast.error('E2EE Error: ' + e2eeError + '. Cannot send.');
      return;
    }
    if (!e2eeReady) {
      toast.error('Encryption not ready, please wait...');
      return;
    }`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Fixed Send button e2ee logic');
