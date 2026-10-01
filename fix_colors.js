const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      // Backgrounds
      content = content.replace(/dark:bg-\[\#1F2937\]/g, "dark:bg-[#151922]");
      content = content.replace(/dark:bg-\[\#171E2D\]/g, "dark:bg-[#11141A]");
      
      // Borders
      content = content.replace(/dark:border-\[\#1F2937\]/g, "dark:border-[#252A34]");
      content = content.replace(/dark:border-\[\#374151\]/g, "dark:border-[#252A34]");
      content = content.replace(/dark:border-white\/10/g, "dark:border-[#252A34]");
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

processDir('src');
console.log("Colors normalized");
