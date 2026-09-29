'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Attachment } from '@/types';
import { useE2EE } from '@/hooks/useE2EE';
import { createClient } from '@/lib/supabase/client';
import { Music, FileText, Download, Loader2 } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

export function EncryptedAttachment({ attachment, isOwn }: { attachment: Attachment; isOwn: boolean }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const { isReady, decryptAttachment } = useE2EE(attachment.conversation_id);
  const supabase = createClient();

  useEffect(() => {
    if (!isReady || !attachment.storage_path) return;

    async function load() {
      try {
        const { data, error: downloadError } = await supabase.storage.from('attachments').download(attachment.storage_path);
        if (downloadError) throw downloadError;
        if (!data) throw new Error("No data");

        const decryptedBlob = await decryptAttachment(data);
        const url = URL.createObjectURL(decryptedBlob);
        setObjectUrl(url);
      } catch (err) {
        console.error('Failed to decrypt attachment', err);
        setError(true);
      }
    }
    load();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isReady, attachment.storage_path]);

  if (error) {
    return <div className="text-xs opacity-70 p-2 border border-red-500/20 rounded">Failed to load encrypted file</div>;
  }

  if (!objectUrl) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs opacity-70">
        <Loader2 className="w-4 h-4 animate-spin" /> Decrypting...
      </div>
    );
  }

  if (attachment.mime_type.startsWith('image/')) {
    return (
      <div className="relative rounded-xl overflow-hidden max-w-xs cursor-pointer">
        <Image
          src={objectUrl}
          alt={attachment.file_name}
          width={attachment.width || 300}
          height={attachment.height || 200}
          className="object-cover rounded-xl"
          style={{ maxHeight: 300, width: 'auto' }}
        />
      </div>
    );
  }

  if (attachment.mime_type.startsWith('video/')) {
    return (
      <video controls className="rounded-xl max-w-xs max-h-48">
        <source src={objectUrl} type={attachment.mime_type} />
      </video>
    );
  }

  if (attachment.mime_type.startsWith('audio/')) {
    return (
      <div className="flex items-center gap-2 min-w-[180px]">
        <Music className="w-4 h-4 text-pink-300" />
        <audio controls className="flex-1" style={{ height: 32 }}>
          <source src={objectUrl} type={attachment.mime_type} />
        </audio>
      </div>
    );
  }

  return (
    <a
      href={objectUrl}
      download={attachment.file_name}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl min-w-[180px] transition-colors',
        isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 dark:bg-[#111827] hover:bg-white dark:bg-[#0B0F19]'
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-pink-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-medium truncate", isOwn ? "text-white" : "text-gray-900 dark:text-gray-100")}>{attachment.file_name}</p>
        <p className={cn("text-[11px]", isOwn ? "text-pink-100" : "text-gray-500 dark:text-gray-400")}>{formatFileSize(attachment.file_size)}</p>
      </div>
      <Download className={cn("w-4 h-4", isOwn ? "text-white" : "text-gray-400")} />
    </a>
  );
}
