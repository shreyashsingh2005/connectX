const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

const regexMap = [
  // Text colors
  { from: /text-gray-900 dark:text-white/g, to: 'text-text-main' },
  { from: /text-gray-800 dark:text-white/g, to: 'text-text-main' },
  { from: /text-gray-900/g, to: 'text-text-main' },
  { from: /text-gray-800/g, to: 'text-text-main' },
  
  { from: /text-gray-700 dark:text-gray-300/g, to: 'text-text-sec' },
  { from: /text-gray-600 dark:text-gray-400/g, to: 'text-text-sec' },
  { from: /text-gray-700 dark:text-gray-200/g, to: 'text-text-sec' },
  { from: /text-gray-700/g, to: 'text-text-sec' },
  { from: /text-gray-600/g, to: 'text-text-sec' },
  
  { from: /text-gray-500 dark:text-gray-400/g, to: 'text-text-muted' },
  { from: /text-gray-400 dark:text-gray-500/g, to: 'text-text-muted' },
  { from: /text-gray-500/g, to: 'text-text-muted' },
  { from: /text-gray-400/g, to: 'text-text-muted' },
  { from: /text-gray-300/g, to: 'text-text-muted' },
  
  { from: /text-white dark:text-gray-900/g, to: 'text-text-main' },
  { from: /text-white/g, to: 'text-white' }, // Explicit white shouldn't change if it's on a brand button
  
  // Backgrounds
  { from: /bg-white dark:bg-transparent/g, to: 'bg-bg-surface dark:bg-transparent' },
  { from: /bg-gray-50 dark:bg-gray-900/g, to: 'bg-bg-secondary' },
  { from: /bg-gray-100 dark:bg-gray-800/g, to: 'bg-bg-secondary' },
  { from: /bg-gray-200 dark:bg-gray-700/g, to: 'bg-border-subtle' },
  
  // Borders
  { from: /border-gray-200 dark:border-gray-800/g, to: 'border-border-subtle' },
  { from: /border-gray-200/g, to: 'border-border-subtle' },
  { from: /border-gray-300/g, to: 'border-border-subtle' },
  
  // Radii tweaks to global radius variables
  { from: /rounded-xl/g, to: 'rounded-[12px]' },
  { from: /rounded-2xl/g, to: 'rounded-[16px]' },
  { from: /rounded-3xl/g, to: 'rounded-[18px]' },
  { from: /rounded-lg/g, to: 'rounded-[10px]' },
  
  // Text Sizes to semantic sizes
  { from: /text-sm/g, to: 'text-[13px]' },
  { from: /text-xs/g, to: 'text-[11px]' },
  { from: /text-base/g, to: 'text-[14px]' },
  { from: /text-lg/g, to: 'text-[16px]' },
  { from: /text-xl/g, to: 'text-[18px]' },
  { from: /text-2xl/g, to: 'text-[22px]' },
  { from: /text-3xl/g, to: 'text-[28px]' },
];

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let original = fs.readFileSync(filePath, 'utf8');
    let code = original;
    
    for (let rule of regexMap) {
      code = code.replace(rule.from, rule.to);
    }
    
    // Safety pass: buttons should usually have text-white if they are bg-brand
    code = code.replace(/bg-brand text-text-main/g, 'bg-brand text-white');
    
    if (code !== original) {
      fs.writeFileSync(filePath, code);
      modifiedCount++;
    }
  }
});

console.log('Generic tailwind classes patched in ' + modifiedCount + ' files.');
