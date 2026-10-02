const fs = require('fs');
const path = require('path');

const dir = path.join('public', 'patterns');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const patterns = {
  'dots': `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="1.5" fill="currentColor" fill-opacity="0.1"/></svg>`,
  'circles': `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.05"/></svg>`,
  'waves': `<svg width="100" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 10 Q25 0 50 10 T100 10" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.05"/></svg>`,
  'grid': `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L40 0 L40 40 L0 40 Z" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.05"/></svg>`,
  'aurora-lines': `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><path d="M0 100 C 20 0 50 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-opacity="0.03"/></svg>`
};

for (const [name, content] of Object.entries(patterns)) {
  fs.writeFileSync(path.join(dir, name + '.svg'), content);
}
console.log("Created pattern SVGs");
