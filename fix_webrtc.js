const fs = require('fs');
const file = 'src/hooks/useWebRTC.ts';
let content = fs.readFileSync(file, 'utf8');

// Find endCall definition
const endCallRegex = /const endCall = useCallback\(async \([^)]*\) => \{[\s\S]*?\}, \[profile, supabase, reset\]\);/;
const match = content.match(endCallRegex);

if (match) {
  content = content.replace(endCallRegex, ''); // Remove it from its current position
  // Insert it right before setupPeerConnection
  content = content.replace('const setupPeerConnection = useCallback((callId: string, isCaller: boolean) => {', match[0] + '\n\n  const setupPeerConnection = useCallback((callId: string, isCaller: boolean) => {');
  fs.writeFileSync(file, content);
}
