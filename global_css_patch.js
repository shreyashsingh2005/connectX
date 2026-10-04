const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modified = 0;
walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let code = fs.readFileSync(filePath, 'utf8');
    let original = code;
    
    // Backgrounds
    code = code.replace(/bg-\[\#151922\]/g, 'bg-[rgba(255,255,255,0.04)]');
    code = code.replace(/bg-\[\#11141A\]/g, 'bg-[#11161B]');
    code = code.replace(/bg-\[\#1A1E29\]/g, 'bg-[rgba(255,255,255,0.06)]');
    code = code.replace(/bg-\[\#0B0D12\]/g, 'bg-[#0B0F12]');
    code = code.replace(/bg-\[\#090B10\]/g, 'bg-[#0B0F12]');
    code = code.replace(/bg-\[\#252A34\]/g, 'bg-[rgba(255,255,255,0.08)]');
    
    // Borders
    code = code.replace(/border-\[\#252A34\]/g, 'border-white/5');
    
    // Hovers
    code = code.replace(/hover:bg-\[\#151922\]/g, 'hover:bg-[rgba(255,255,255,0.04)]');
    code = code.replace(/hover:bg-\[\#252A34\]/g, 'hover:bg-[rgba(255,255,255,0.08)]');
    code = code.replace(/hover:bg-\[\#11141A\]/g, 'hover:bg-[rgba(255,255,255,0.02)]');
    code = code.replace(/hover:bg-\[\#1A1E29\]/g, 'hover:bg-[rgba(255,255,255,0.06)]');
    code = code.replace(/hover:bg-\[\#1A1F2B\]/g, 'hover:bg-[rgba(255,255,255,0.06)]');
    
    // Colors
    code = code.replace(/text-\[\#98A2B3\]/g, 'text-[#A7AFB8]');
    code = code.replace(/text-\[\#D0D5DD\]/g, 'text-[#F5F7FA]');
    
    if (code !== original) {
      fs.writeFileSync(filePath, code);
      modified++;
    }
  }
});
console.log('Globally patched ' + modified + ' files for dark mode colors');
