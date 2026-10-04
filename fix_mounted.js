const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
content = content.replace(
  'function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {\n  const [devices, setDevices] = useState<any[]>([]);',
  'function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {\n  const [devices, setDevices] = useState<any[]>([]);\n  const [mounted, setMounted] = useState(false);\n  useEffect(() => setMounted(true), []);'
);
content = content.replace(
  'function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {\r\n  const [devices, setDevices] = useState<any[]>([]);',
  'function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {\r\n  const [devices, setDevices] = useState<any[]>([]);\r\n  const [mounted, setMounted] = useState(false);\r\n  useEffect(() => setMounted(true), []);'
);
fs.writeFileSync('src/app/(app)/settings/page.tsx', content);
