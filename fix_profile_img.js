const fs = require('fs');

let content = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const targetStr = `<a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden block">
                      <img src={att.url} alt={att.file_name} width={80} height={80} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </a>`;

const replacement = `<div key={att.id} className="aspect-square rounded-lg overflow-hidden block">
                      <DecryptedMediaThumbnail attachment={att} />
                    </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync('src/components/chat/ProfilePanel.tsx', content);
  console.log('Successfully replaced img with DecryptedMediaThumbnail');
} else {
  console.log('Target string not found');
}
