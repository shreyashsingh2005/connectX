const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Remove the old marker
code = code.replace(/<div className="p-4 text-xs text-gray-500 font-mono">CONNECTX_BUILD_DEBUG: 6c1ca4f<\/div>/g, '');

// Insert the new marker right before the final closing div
const finalMarker = `\n      <div data-testid="connectx-build-debug" className="p-4 text-center text-xs text-gray-500 font-mono opacity-50">\n        CONNECTX_BUILD_DEBUG: 6c1ca4f\n      </div>\n    </div>\n  );\n}\n`;

code = code.replace(/<\/div>\n  \);\n\}\n?/s, finalMarker);

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log('Fixed marker position');
