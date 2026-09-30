const fs = require('fs');
let file = fs.readFileSync('src/components/chat/EncryptedAttachment.tsx', 'utf8');

if (!file.includes("isFullscreen")) {
  file = file.replace(
    /const \[error, setError\] = useState\(false\);/,
    `const [error, setError] = useState(false);\n  const [isFullscreen, setIsFullscreen] = useState(false);`
  );

  file = file.replace(
    /import \{ Music, FileText, Download, Loader2 \} from 'lucide-react';/,
    `import { Music, FileText, Download, Loader2, X } from 'lucide-react';`
  );

  const imageReturn = `
  if (attachment.mime_type.startsWith('image/')) {
    return (
      <>
        <div 
          className="relative max-w-sm rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity group"
          onClick={() => setIsFullscreen(true)}
        >
          <img src={objectUrl} alt={attachment.file_name} className="w-full h-auto max-h-64 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
             <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl">
               View Fullscreen
             </div>
          </div>
        </div>

        {isFullscreen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-8" onClick={() => setIsFullscreen(false)}>
            <button 
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={objectUrl} 
              alt={attachment.file_name} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        )}
      </>
    );
  }
`;

  file = file.replace(
    /if \(attachment\.mime_type\.startsWith\('image\/'\)\) \{[\s\S]*?return \([\s\S]*?<img src=\{objectUrl\} alt=\{attachment\.file_name\} className="w-full h-full object-cover rounded-lg" \/>[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}/,
    imageReturn.trim()
  );

  fs.writeFileSync('src/components/chat/EncryptedAttachment.tsx', file);
  console.log("Added lightbox");
} else {
  console.log("Already has lightbox");
}
