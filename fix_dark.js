const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');
if (!css.includes('@custom-variant dark')) {
  css = css.replace('@import "tailwindcss";', '@import "tailwindcss";\n\n@custom-variant dark (&:is(.dark *));');
  fs.writeFileSync('src/app/globals.css', css);
  console.log('Fixed Tailwind dark variant in globals.css');
}
