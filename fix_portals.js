const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

if (!content.includes('import { createPortal }')) {
  content = content.replace("import { useState, useRef, useEffect } from 'react';", "import { useState, useRef, useEffect } from 'react';\nimport { createPortal } from 'react-dom';");
}

// Wrap ChangePasswordModal return
content = content.replace(
  'return (\n    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">',
  'return createPortal(\n    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">'
);

// Close parenthesis for ChangePasswordModal
content = content.replace(
  '</form>\n      </div>\n    </div>\n  );',
  '</form>\n      </div>\n    </div>,\n    document.body\n  );'
);

// Wrap ManageSessionsModal return
content = content.replace(
  'return (\n    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">',
  'return createPortal(\n    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">'
);

// Close parenthesis for ManageSessionsModal
content = content.replace(
  'Sign out all other sessions\n          </button>\n        </div>\n      </div>\n    </div>\n  );',
  'Sign out all other sessions\n          </button>\n        </div>\n      </div>\n    </div>,\n    document.body\n  );'
);

// Wait, the hook `document.body` might cause SSR hydration errors if not checked.
// Let's add a mounted check for SSR.
const replaceStr1 = `function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted) return null;`;

content = content.replace(
  /function ChangePasswordModal[^]+?if \(!isOpen\) return null;/m,
  replaceStr1
);

const replaceStr2 = `function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;`;

content = content.replace(
  /function ManageSessionsModal[^]+?useEffect\(\(\) => {\n    if \(!isOpen\) return;/m,
  replaceStr2
);

content = content.replace(/if \(!isOpen\) return null;/m, "if (!isOpen || !mounted) return null;");

fs.writeFileSync('src/app/(app)/settings/page.tsx', content);
