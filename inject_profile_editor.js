const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

if (!code.includes('<ProfilePhotoEditor')) {
  // Find the last closing div
  const lastDivIndex = code.lastIndexOf('</div>');
  if (lastDivIndex !== -1) {
    code = code.slice(0, lastDivIndex) + 
      `\n      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}\n    ` + 
      code.slice(lastDivIndex);
  }
}

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log('Appended ProfilePhotoEditor successfully!');
