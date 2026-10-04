const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const updatedThumbnail = `
function DecryptedMediaThumbnail({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isReady, decryptAttachment } = useE2EE(attachment.conversation_id);
  const supabase = createClient();

  useEffect(() => {
    if (!isReady || !attachment.storage_path) return;
    let objectUrl: string | null = null;
    
    async function load() {
      try {
        const { data, error } = await supabase.storage.from('attachments').download(attachment.storage_path);
        if (error || !data) return;
        const decrypted = await decryptAttachment(data, attachment.mime_type);
        objectUrl = URL.createObjectURL(decrypted);
        setUrl(objectUrl);
      } catch (e) {
        console.error('Thumbnail decrypt failed', e);
      }
    }
    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [isReady, attachment.storage_path]);

  if (!url) return <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />;
  
  return (
    <>
      <img 
        src={url} 
        alt={attachment.file_name} 
        onClick={() => setIsFullscreen(true)}
        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" 
      />
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8" onClick={() => setIsFullscreen(false)}>
          <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-3">
            <a 
              href={url}
              download={attachment.file_name}
              onClick={(e) => e.stopPropagation()}
              className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Download photo"
              title="Download photo"
            >
              <Download size={18} strokeWidth={2} />
            </a>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
              className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Close viewer"
              title="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <img src={url} alt={attachment.file_name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
`;

// Extract existing thumbnail
const regex = /function DecryptedMediaThumbnail\(\{ attachment \}: \{ attachment: Attachment \}\) \{[\s\S]*?return <img src=\{url\}[^>]*>;\s*\}/;

content = content.replace(regex, updatedThumbnail.trim());

if (!content.includes('import { Download')) {
  content = content.replace("import { Shield, Bell, Image as ImageIcon, FileText, Ban, Flag, Video, MoreVertical, X } from 'lucide-react';", "import { Shield, Bell, Image as ImageIcon, FileText, Ban, Flag, Video, MoreVertical, X, Download } from 'lucide-react';");
}

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', content);
