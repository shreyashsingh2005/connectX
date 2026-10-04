const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Match precisely what's there
code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<div>\s*<button type="button"[\s\S]*?Max 5MB\.<\/p>\s*<\/div>\s*<\/div>\s*<\/div>/, '</div>\n              </div>\n            </div>');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Regex cleaned orphaned HTML");
