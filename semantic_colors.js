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
  // Backgrounds
  { from: /bg-white dark:bg-\[[^\]]+\]/g, to: 'bg-bg-surface' },
  { from: /bg-\[\#F8FAFC\] dark:bg-\[[^\]]+\]/g, to: 'bg-bg-primary' },
  { from: /bg-\[\#F7F8FC\] dark:bg-\[[^\]]+\]/g, to: 'bg-bg-primary' },
  { from: /bg-\[\#F1F5F9\] dark:bg-\[[^\]]+\]/g, to: 'bg-bg-secondary' },
  { from: /bg-gray-50 dark:bg-\[[^\]]+\]/g, to: 'bg-bg-secondary' },
  { from: /bg-\[\#11161B\]/g, to: 'bg-bg-surface' },
  { from: /bg-\[\#0B0F12\]/g, to: 'bg-bg-primary' },
  { from: /bg-white/g, to: 'bg-bg-surface' },
  
  // Borders
  { from: /border-\[\#EAECF0\] dark:border-\[[^\]]+\]/g, to: 'border-border-subtle' },
  { from: /border-\[\#E2E8F0\] dark:border-\[[^\]]+\]/g, to: 'border-border-subtle' },
  { from: /border-gray-200 dark:border-\[[^\]]+\]/g, to: 'border-border-subtle' },
  { from: /border-\[\#EAECF0\]/g, to: 'border-border-subtle' },
  { from: /dark:border-\[\#252A34\]/g, to: 'border-border-subtle' },
  { from: /dark:border-white\/5/g, to: 'border-border-subtle' },
  
  // Text
  { from: /text-\[\#101828\] dark:text-\[\#F5F7FA\]/g, to: 'text-text-main' },
  { from: /text-\[\#101828\] dark:text-\[\#[A-F0-9]+\]/g, to: 'text-text-main' },
  { from: /text-\[\#344054\] dark:text-\[\#[A-F0-9]+\]/g, to: 'text-text-main' },
  { from: /text-\[\#667085\] dark:text-\[\#A7AFB8\]/g, to: 'text-text-sec' },
  { from: /text-\[\#667085\] dark:text-\[\#737C86\]/g, to: 'text-text-sec' },
  { from: /text-\[\#98A2B3\] dark:text-\[\#[A-F0-9]+\]/g, to: 'text-text-muted' },
  { from: /text-\[\#667085\]/g, to: 'text-text-sec' },
  { from: /text-\[\#A7AFB8\]/g, to: 'text-text-sec' },
  { from: /text-\[\#F5F7FA\]/g, to: 'text-text-main' },
  { from: /text-\[\#101828\]/g, to: 'text-text-main' },
  
  // Hovers
  { from: /hover:bg-gray-50 dark:hover:bg-\[[^\]]+\]/g, to: 'hover:bg-bg-secondary' },
  { from: /hover:bg-\[\#F8FAFC\] dark:hover:bg-\[[^\]]+\]/g, to: 'hover:bg-bg-secondary' },
  { from: /hover:bg-\[\#F9FAFB\] dark:hover:bg-\[[^\]]+\]/g, to: 'hover:bg-bg-secondary' },
  { from: /hover:text-\[\#101828\] dark:hover:text-\[\#F5F7FA\]/g, to: 'hover:text-text-main' },
  
  // Brand
  { from: /bg-\[\#8B5CF6\]/g, to: 'bg-brand' },
  { from: /text-\[\#8B5CF6\] dark:text-\[\#A78BFA\]/g, to: 'text-brand' },
  { from: /text-\[\#8B5CF6\]/g, to: 'text-brand' },
  { from: /hover:bg-\[\#7C3AED\]/g, to: 'hover:bg-brand-dark' },
  { from: /bg-\[\#8B5CF6\]\/10/g, to: 'bg-brand-soft' },
  { from: /bg-\[rgba\(139,92,246,0\.14\)\]/g, to: 'bg-brand-soft' },
  { from: /text-\[\#A78BFA\]/g, to: 'text-brand' },
];

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let original = fs.readFileSync(filePath, 'utf8');
    let code = original;
    
    for (let rule of regexMap) {
      code = code.replace(rule.from, rule.to);
    }
    
    if (code !== original) {
      fs.writeFileSync(filePath, code);
      modifiedCount++;
    }
  }
});

console.log('Semantic colors patched in ' + modifiedCount + ' files.');
