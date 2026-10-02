const fs = require('fs');

let settingsPage = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

if (!settingsPage.includes('CONNECTX_BUILD_DEBUG')) {
  settingsPage = settingsPage.replace(
    '</form>',
    `</form>\n              <div className="p-4 text-xs text-gray-500 font-mono">CONNECTX_BUILD_DEBUG: 6c1ca4f</div>`
  );
  fs.writeFileSync('src/app/(app)/settings/page.tsx', settingsPage, 'utf8');
}
console.log('Added build marker');
