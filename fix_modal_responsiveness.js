const fs = require('fs');

function fixModalResponsiveness(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix width and max-height
  content = content.replace(
    /className="w-full max-w-md([^"]*) max-h-\[85vh\]([^"]*)"/g,
    'className="w-[calc(100vw-32px)] md:w-full max-w-md$1 max-h-[calc(100dvh-32px)] md:max-h-[85vh]$2"'
  );
  
  content = content.replace(
    /className="relative w-full max-w-md([^"]*) max-h-\[85vh\]([^"]*)"/g,
    'className="relative w-[calc(100vw-32px)] md:w-full max-w-md$1 max-h-[calc(100dvh-32px)] md:max-h-[85vh]$2"'
  );
  
  // Settings page modals
  content = content.replace(
    /className="w-full max-w-sm([^"]*)"/g,
    'className="w-[calc(100vw-32px)] md:w-full max-w-sm$1"'
  );
  content = content.replace(
    /className="w-full max-w-md([^"]*) max-h-\[80vh\]([^"]*)"/g,
    'className="w-[calc(100vw-32px)] md:w-full max-w-md$1 max-h-[calc(100dvh-32px)] md:max-h-[80vh]$2"'
  );

  fs.writeFileSync(filePath, content);
}

fixModalResponsiveness('src/components/modals/NewChatModal.tsx');
fixModalResponsiveness('src/components/modals/ForwardModal.tsx');
fixModalResponsiveness('src/components/modals/GroupChatModal.tsx');
fixModalResponsiveness('src/components/modals/UsernameSetupModal.tsx');
fixModalResponsiveness('src/app/(app)/settings/page.tsx');

console.log('Fixed Modals Responsiveness');
