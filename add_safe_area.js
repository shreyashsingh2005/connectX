const fs = require('fs');

let css = fs.readFileSync('src/app/globals.css', 'utf8');

if (!css.includes('.safe-pt')) {
  css += `

@utility safe-pt {
  padding-top: env(safe-area-inset-top);
}

@utility safe-pb {
  padding-bottom: env(safe-area-inset-bottom);
}

@utility safe-pl {
  padding-left: env(safe-area-inset-left);
}

@utility safe-pr {
  padding-right: env(safe-area-inset-right);
}

@utility p-safe {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
`;
  fs.writeFileSync('src/app/globals.css', css);
  console.log('Added safe-area utilities to globals.css');
} else {
  console.log('Safe-area utilities already exist in globals.css');
}
