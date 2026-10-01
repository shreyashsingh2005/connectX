const fs = require('fs');
let text = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf-8');

text = text.replace(
  /<input\s+ref=\{fileInputRef\}\s+onChange=\{handleFileSelect\}\s+className="hidden"\s+multiple\s+\/>/g,
  '<input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />'
);

text = text.replace(
  /<button\s+onClick=\{\(\) => fileInputRef.current\?\.click\(\)\}/g,
  '<button type="button" onClick={() => fileInputRef.current?.click()}'
);

text = text.replace(
  /<button\s+onClick=\{handleSend\}/g,
  '<button type="button" onClick={handleSend}'
);

text = text.replace(
  /<button\s+onClick=\{isRecording \? stopRecording : startRecording\}/g,
  '<button type="button" onClick={isRecording ? stopRecording : startRecording}'
);

text = text.replace(
  /placeholder=\{isRecording \? `Recording\.\.\. \$\{recordingDuration\}s` : "Message\.\.\."\}/g,
  'placeholder={isRecording ? `Recording... ${recordingDuration}s` : "Write a message..."}'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', text);
