const fs = require('fs');

let css = fs.readFileSync('src/app/globals.css', 'utf8');

css = css.replace(
  /@import "tailwindcss";\n@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600;700&display=swap'\);/g,
  '@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap\');\n@import "tailwindcss";'
);

fs.writeFileSync('src/app/globals.css', css);
console.log("globals.css @import fixed");
