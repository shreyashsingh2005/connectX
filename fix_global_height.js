const fs = require('fs');

let css = fs.readFileSync('src/app/globals.css', 'utf8');

css = css.replace(
  /html, body, #__next, main \{\s*height: 100%;\s*\}/,
  `html, body, #__next, main {
  height: 100dvh;
}`
);

fs.writeFileSync('src/app/globals.css', css);
console.log('Updated globals.css html/body height');
