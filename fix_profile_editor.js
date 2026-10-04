const fs = require('fs');

function fixModalResponsiveness(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix width and max-height
  content = content.replace(
    /className="bg-bg-surface border border-border-subtle border-border-subtle w-full max-w-\[400px\] rounded-\[20px\] shadow-2xl overflow-hidden flex flex-col"/g,
    'className="bg-bg-surface border border-border-subtle w-[calc(100vw-32px)] md:w-full max-w-[400px] max-h-[calc(100dvh-32px)] md:max-h-[85vh] rounded-[20px] shadow-2xl overflow-hidden flex flex-col"'
  );
  
  content = content.replace(
    /w-\[280px\] h-\[280px\]/g,
    'w-[240px] h-[240px] md:w-[280px] md:h-[280px]'
  );

  fs.writeFileSync(filePath, content);
}

fixModalResponsiveness('src/components/profile/ProfilePhotoEditor.tsx');

console.log('Fixed ProfilePhotoEditor Responsiveness');
