const fs = require('fs');
let content = fs.readFileSync('src/components/chat/EncryptedAttachment.tsx', 'utf8');

// Replace the <a download> tag styling and icon
const oldA = `<a 
                href={objectUrl}
                download={attachment.file_name}
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center"
                title="Download"
              >
                <Download className="w-6 h-6" />
              </a>`;

const newA = `<a 
                href={objectUrl}
                download={attachment.file_name}
                onClick={(e) => e.stopPropagation()}
                className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Download photo"
                title="Download photo"
              >
                <Download size={18} strokeWidth={2} />
              </a>`;

// Let's use regex to replace in case of whitespace differences
const regexA = /<a[^>]*href=\{objectUrl\}[^>]*download=\{attachment\.file_name\}[^>]*>[\s\S]*?<Download[^>]*>[\s\S]*?<\/a>/;

content = content.replace(regexA, newA);

// Also fix the close button to match styling if needed
const closeRegex = /<button[^>]*onClick=\{[^}]*setIsFullscreen\(false\)\}[^>]*>[\s\S]*?<X[^>]*>[\s\S]*?<\/button>/;
const newClose = `<button 
                onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Close viewer"
                title="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>`;

content = content.replace(closeRegex, newClose);

fs.writeFileSync('src/components/chat/EncryptedAttachment.tsx', content);
