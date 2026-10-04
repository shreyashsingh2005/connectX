const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

content = content.replace(
  'function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {\n  const [devices, setDevices] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);\n  const supabase = createClient();\n\n  useEffect(() => {\n    if (!isOpen) return;\n    loadDevices();\n  }, [isOpen]);',
  'function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {\n  const [devices, setDevices] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);\n  const supabase = createClient();\n  const [mounted, setMounted] = useState(false);\n\n  useEffect(() => setMounted(true), []);\n\n  useEffect(() => {\n    if (!isOpen) return;\n    loadDevices();\n  }, [isOpen]);'
);

content = content.replace(/if \(!isOpen\) return null;/g, "if (!isOpen || !mounted) return null;");

fs.writeFileSync('src/app/(app)/settings/page.tsx', content);

let msgContent = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');
msgContent = msgContent.replace("} from 'lucide-react';", "  Pin,\n} from 'lucide-react';");
fs.writeFileSync('src/components/chat/MessageBubble.tsx', msgContent);
