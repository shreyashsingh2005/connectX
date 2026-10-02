const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

code = code.replace(
  /UserRound, Palette, X, Ban/,
  "UserRound, Palette, X, Ban, Clock"
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log("Fixed missing Clock import in SettingsPage");
