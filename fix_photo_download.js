const fs = require('fs');
let content = fs.readFileSync('src/components/chat/EncryptedAttachment.tsx', 'utf8');

const fullscreenCloseButton = `<button 
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </button>`;

const newFullscreenButtons = `<div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-3">
              <a 
                href={objectUrl}
                download={attachment.file_name}
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center"
                title="Download"
              >
                <Download className="w-6 h-6" />
              </a>
              <button 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>`;

content = content.replace(fullscreenCloseButton, newFullscreenButtons);

if (!content.includes('import {') || !content.includes('Download')) {
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
    if (!p1.includes('Download')) return `import {${p1}, Download} from 'lucide-react';`;
    return match;
  });
}

fs.writeFileSync('src/components/chat/EncryptedAttachment.tsx', content);
