const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// The modals exist, but are not rendered. Let's append them right before the final closing div of SettingsPage.
// SettingsPage ends with:
//       <div data-testid="connectx-build-debug" className="p-4 text-center text-xs text-gray-500 font-mono opacity-50">
//         CONNECTX_BUILD_DEBUG: 6c1ca4f
//       </div>
//     </div>
//   );
// }

const modalStr = `
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <ManageSessionsModal isOpen={showSessionsModal} onClose={() => setShowSessionsModal(false)} />
`;

if (!content.includes('<ChangePasswordModal isOpen={showPasswordModal}')) {
  content = content.replace(
    /(\s*)<div data-testid="connectx-build-debug"/,
    modalStr + '$1<div data-testid="connectx-build-debug"'
  );
  fs.writeFileSync('src/app/(app)/settings/page.tsx', content);
  console.log('Modals injected into render tree.');
} else {
  console.log('Modals already injected.');
}
