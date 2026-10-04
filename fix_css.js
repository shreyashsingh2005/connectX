const fs = require('fs');

let css = fs.readFileSync('src/app/globals.css', 'utf8');

// replace the global * selector with @layer base 
css = css.replace(
  /\* \{\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n\}/g,
  '@layer base {\n  * {\n    box-sizing: border-box;\n    margin: 0;\n    padding: 0;\n  }\n}'
);

fs.writeFileSync('src/app/globals.css', css);
console.log("globals.css updated");
