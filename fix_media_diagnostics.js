const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const updatedThumbnail = `
function DecryptedMediaThumbnail({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isReady, decryptAttachment } = useE2EE(attachment.conversation_id);
  const supabase = createClient();

  useEffect(() => {
    console.log('[MediaDiagnostics] MEDIA TAB OPEN -> attachment query START for:', attachment.id);
    if (!isReady) {
      console.log('[MediaDiagnostics] E2EE not ready yet for conversation:', attachment.conversation_id);
      return;
    }
    if (!attachment.storage_path) {
      console.log('[MediaDiagnostics] No storage_path found in attachment object', attachment);
      return;
    }
    
    let objectUrl: string | null = null;
    
    async function load() {
      try {
        console.log('[MediaDiagnostics] download START for path:', attachment.storage_path);
        const { data, error } = await supabase.storage.from('attachments').download(attachment.storage_path);
        
        if (error) {
          console.error('[MediaDiagnostics] download FAIL:', error);
          return;
        }
        if (!data) {
          console.error('[MediaDiagnostics] download FAIL: No data returned');
          return;
        }
        
        console.log('[MediaDiagnostics] download SUCCESS, encrypted byte size:', data.size);
        console.log('[MediaDiagnostics] decrypt START with mime_type:', attachment.mime_type);
        
        const decrypted = await decryptAttachment(data, attachment.mime_type);
        
        console.log('[MediaDiagnostics] decrypt SUCCESS, decrypted byte size:', decrypted.size, 'MIME:', decrypted.type);
        
        objectUrl = URL.createObjectURL(decrypted);
        console.log('[MediaDiagnostics] objectURL created:', objectUrl);
        setUrl(objectUrl);
      } catch (e) {
        console.error('[MediaDiagnostics] decrypt FAIL / pipeline error:', e);
      }
    }
    load();
    return () => { 
      if (objectUrl) {
        console.log('[MediaDiagnostics] revoking objectURL:', objectUrl);
        URL.revokeObjectURL(objectUrl); 
      }
    };
  }, [isReady, attachment.storage_path]);

  if (!url) return <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />;
  
  return (
    <>
      <img 
        src={url} 
        alt={attachment.file_name} 
        onClick={() => setIsFullscreen(true)}
        onLoad={() => console.log('[MediaDiagnostics] image onLoad SUCCESS:', attachment.id)}
        onError={(e) => console.error('[MediaDiagnostics] image onError FAIL:', attachment.id, e)}
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

const regex = /function DecryptedMediaThumbnail\(\{ attachment \}: \{ attachment: Attachment \}\) \{[\s\S]*?return \(\s*<>\s*<img[\s\S]*?<\/>\s*\);\s*\}/;

content = content.replace(regex, updatedThumbnail.trim());

// Let's also add realtime for attachments so that sending an image instantly populates the tab!
const realtimeAttachments = `
    const attachChannel = supabase.channel(\`profile_attach:\${conversation.id}\`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attachments', filter: \`conversation_id=eq.\${conversation.id}\` }, () => {
        loadMedia();
      })
      .subscribe();
`;

// Insert attachChannel inside the useEffect that loads media
content = content.replace(
  /const channel = supabase\.channel\(\`profile_pins:\$\{conversation\.id\}\`\)/,
  realtimeAttachments.trim() + '\n    const channel = supabase.channel(`profile_pins:${conversation.id}`)'
);
// Make sure it cleans up attachChannel too
content = content.replace(
  /return \(\) => \{ supabase\.removeChannel\(channel\); \};/,
  'return () => { supabase.removeChannel(channel); supabase.removeChannel(attachChannel); };'
);

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', content);
