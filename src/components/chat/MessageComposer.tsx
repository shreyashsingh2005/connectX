import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { Smile, Paperclip, Mic, Send, X, FileText, Loader2, Square, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { getFileType } from '@/lib/utils';
import { useE2EE } from '@/hooks/useE2EE';
import { useThemeStore, ThemeId } from '@/store/useThemeStore';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { AttachmentPreview as AttachmentPreviewType } from '@/types';

interface MessageComposerProps {
  conversationId: string;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreviewType[]>([]);
  const [isSending, setIsSending] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();
  const { resolvedTheme } = useTheme();
  const profile = useAuthStore(s => s.profile);
  const activeTheme = useThemeStore(s => s.getEffectiveTheme(conversationId));
  const { isReady: e2eeReady, error: e2eeError, encrypt, encryptAttachment } = useE2EE(conversationId);
  const replyToMessage = useChatStore(s => s.replyToMessage);
  const setReplyToMessage = useChatStore(s => s.setReplyToMessage);
  const addMessage = useChatStore(s => s.addMessage);
  const updateMessage = useChatStore(s => s.updateMessage);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [text]);

  // Click-away listener for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && emojiPickerRef.current && emojiButtonRef.current) {
        const isOutsidePicker = !emojiPickerRef.current.contains(event.target as Node);
        const isOutsideButton = !emojiButtonRef.current.contains(event.target as Node);
        
        if (isOutsidePicker && isOutsideButton) {
          setShowEmojiPicker(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData: any, event: MouseEvent) => {
    const cursor = textareaRef.current?.selectionStart ?? text.length;
    const newText = text.slice(0, cursor) + emojiData.emoji + text.slice(cursor);
    setText(newText);
    
    // Focus back and move cursor after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursor + emojiData.emoji.length, cursor + emojiData.emoji.length);
      }
    }, 0);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    toast.error('Voice messaging coming soon!');
    setTimeout(() => setIsRecording(false), 1500);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const sendTypingStatus = async (typing: boolean) => {
    if (!profile) return;
    const channel = supabase.channel(`room:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: profile.id, username: profile.username, typing },
    });
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) sendTypingStatus(false);
    };
  }, [profile, conversationId, supabase]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(false);
    }, 2000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newAtts = files.map(file => ({
        id: uuidv4(),
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        type: getFileType(file.type) as 'image' | 'video' | 'audio' | 'document'
      }));
      setAttachments(prev => [...prev, ...newAtts]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter(a => a.id !== id);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      const newAtts = files.map(file => ({
        id: uuidv4(),
        file,
        preview: URL.createObjectURL(file),
        type: 'image' as const
      }));
      setAttachments(prev => [...prev, ...newAtts]);
    }
  };

  const uploadAttachment = async (att: AttachmentPreviewType, messageId: string) => {
    if (!profile) return null;
    try {
      const encryptedFile = await encryptAttachment(att.file);
      const ext = att.file.name.split('.').pop();
      const path = `${conversationId}/${messageId}/${uuidv4()}.${ext}.enc`;
      
      const { error: uploadErr } = await supabase.storage
        .from('chat_attachments')
        .upload(path, encryptedFile, { contentType: 'application/octet-stream' });
        
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(path);

      return { url: publicUrl, path };
    } catch (err) {
      console.error('Attachment upload failed', err);
      toast.error('Failed to upload attachment securely');
      return null;
    }
  };

  
  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const contentText = text.trim();
    if (!contentText && attachments.length === 0) return;
    if (!profile || isSending || isSubmittingRef.current) return;
    
    if (e2eeError) {
      toast.error('E2EE Error: ' + e2eeError + '. Cannot send.');
      return;
    }
    if (!e2eeReady) {
      toast.error('Encryption not ready, please wait...');
      return;
    }
    
    isSubmittingRef.current = true;
    setIsSending(true);
    const tempId = uuidv4();

    // Save state in case of failure
    const savedText = text;
    const savedAttachments = [...attachments];
    const savedReply = replyToMessage;

    try {
      // 1. Encrypt message content BEFORE creating optimistic UI
      let finalContent = contentText || null;
      if (finalContent) {
        try {
          finalContent = await encrypt(finalContent);
        } catch (encErr) {
          console.error('Encryption failed', encErr);
          toast.error('Failed to encrypt message');
          throw new Error('Encryption failed');
        }
      }

      // 2. ONLY NOW create optimistic UI message
      const optimisticMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: profile.id,
        content: finalContent, // Store actual ciphertext or null
        type: savedAttachments.length > 0 ? (savedAttachments[0].type as 'image' | 'video' | 'audio' | 'document') : 'text' as const,
        status: 'sending' as const,
        decrypted_content: contentText || null, // Keep plaintext for UI
        reply_to_id: savedReply?.id || null,
        forwarded_from_id: null,
        is_edited: false,
        is_deleted: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: profile,
        reply_to: savedReply || undefined,
        attachments: [],
        reactions: [],
      };

      addMessage(conversationId, optimisticMessage as any);

      // Clear UI
      setText('');
      setReplyToMessage(null);
      setAttachments([]);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      sendTypingStatus(false);

      // 3. Insert into DB
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          id: tempId,
          conversation_id: conversationId,
          sender_id: profile.id,
          content: finalContent,
          type: savedAttachments.length > 0 ? getFileType(savedAttachments[0].file.type) : 'text',
          status: 'sent',
          reply_to_id: savedReply?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // 4. Update status to sent
      updateMessage(conversationId, tempId, { 
        ...newMessage, 
        status: 'sent',
        sender: profile,
        decrypted_content: contentText || null
      });

      // 5. Upload attachments
      for (const att of savedAttachments) {
        const uploadRes = await uploadAttachment(att, tempId);
        if (uploadRes) {
          const { url, path } = uploadRes;
          await supabase.from('attachments').insert({
            message_id: tempId,
            conversation_id: conversationId,
            user_id: profile.id,
            file_name: att.file.name,
            file_size: att.file.size,
            mime_type: att.file.type,
            storage_path: path,
            url: url
          });
        }
      }
    } catch (err) {
      console.error('Send failed:', err);
      // Restore input text so user can try again
      setText(savedText);
      setAttachments(savedAttachments);
      setReplyToMessage(savedReply);
      
      // Remove optimistic message if it was added (if error happened after addMessage)
      useChatStore.getState().removeMessage(conversationId, tempId);
    } finally {
      isSubmittingRef.current = false;
      setIsSending(false);
    }
  }



  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const newAtts = files.map(file => ({
        id: uuidv4(),
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        type: getFileType(file.type) as 'image' | 'video' | 'audio' | 'document'
      }));
      setAttachments(prev => [...prev, ...newAtts]);
    }
  };

  return (
    <form onSubmit={handleSend}
      className="border border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#11141A] shadow-md rounded-[24px] flex-shrink-0 px-3 py-2.5 relative mx-2 md:mx-4 mb-2 md:mb-4 mt-2 transition-all" 
      style={{ marginBottom: 'calc(max(env(safe-area-inset-bottom), 8px))' }}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-[100%] right-0 md:right-4 mb-3 z-[50] w-[calc(100vw-24px)] sm:w-[350px] shadow-[0_12px_35px_rgba(16,24,40,0.12)] dark:shadow-none rounded-[24px] overflow-hidden border border-[#EAECF0] dark:border-[#252A34] emoji-picker-wrapper animate-in fade-in slide-in-from-bottom-2 duration-150">
          <EmojiPicker 
            onEmojiClick={handleEmojiClick}
            theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
            lazyLoadEmojis={true}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={true}
            searchPlaceHolder="Search emoji..."
            width="100%"
            height="400px"
            style={{ 
              '--epr-bg-color': 'var(--epr-bg-color)',
              '--epr-text-color': 'var(--epr-text-color)',
              '--epr-picker-border-color': 'var(--epr-border-color)',
              '--epr-category-icon-active-color': '#8B5CF6',
              '--epr-search-border-color': 'var(--epr-border-color)',
              '--epr-search-input-bg-color': 'transparent',
              '--epr-hover-bg-color': 'var(--epr-hover-bg)',
              '--epr-focus-bg-color': 'var(--epr-hover-bg)',
              '--epr-search-input-height': '38px',
              '--epr-search-input-border-radius': '10px',
              '--epr-category-navigation-button-size': '32px',
              '--epr-emoji-size': '24px',
              '--epr-emoji-padding': '4px'
            } as any}
          />
        </div>
      )}
      
      {/* Reply preview */}
      {replyToMessage && (
        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-[#F8FAFC] dark:bg-[#11141A] rounded-[10px] border border-[#EAECF0] dark:border-[#252A34]">
          <div className="flex-1 border-l-2 border-[#8B5CF6] pl-2 min-w-0">
            <p className="text-[12px] font-medium text-[#8B5CF6] truncate">{replyToMessage.sender?.display_name || 'Someone'}</p>
            <p className="text-[12px] text-[#667085] dark:text-[#98A2B3] truncate">{replyToMessage.decrypted_content || 'Attachment'}</p>
          </div>
          <button type="button" onClick={() => setReplyToMessage(null)} className="text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#252A34] transition-colors" aria-label="Cancel reply">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto p-1 no-scrollbar">
          {attachments.map(att => (
            <div key={att.id} className="relative group flex-shrink-0 w-16 h-16 rounded-[10px] border border-[#EAECF0] dark:border-[#252A34] bg-[#F8FAFC] dark:bg-[#151922] overflow-hidden">
              {att.type === 'image' ? (
                <img src={att.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText size={20} className="text-[#667085] dark:text-[#98A2B3]" />
                </div>
              )}
              <button type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1 -right-1 bg-[#101828] dark:bg-white text-white dark:text-[#101828] rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove attachment"
              >
                <X size={12} />
              </button>
              {att.uploadProgress !== undefined && att.uploadProgress < 100 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-white">{Math.round(att.uploadProgress)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1 sm:gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-[#F8FAFC] dark:hover:bg-[#151922] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
          aria-label="Open attachments" title="Open attachments"
        >
          <Plus size={20} strokeWidth={2} />
        </button>

        <div className="flex-1 min-h-[40px] max-h-32 bg-transparent flex items-center px-1 transition-all overflow-hidden relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isRecording ? `Recording... ${recordingDuration}s` : "Write a message..."}
            disabled={isRecording || isSending}
            className="flex-1 max-h-32 bg-transparent text-[14px] text-[#101828] dark:text-[#F5F7FA] placeholder:text-[#98A2B3] resize-none py-2.5 sm:py-3 px-2 sm:px-3 focus:outline-none custom-scrollbar leading-tight"
            rows={1}
            style={{ minHeight: '40px' }}
          />
          
          <div className="relative flex items-center justify-center mr-1">
            <button type="button" ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Open emoji picker" aria-label="Open emoji picker"
              className={`flex w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex-shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${showEmojiPicker ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-[#F8FAFC] dark:hover:bg-[#151922]"}`}
            >
              <Smile size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple aria-label="Hidden file input" />
        </div>

        {text.trim() || attachments.length > 0 ? (
          <button type="submit"
            disabled={isSending || (!e2eeReady && !e2eeError)}
            className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full text-white hover:opacity-90 hover:scale-102 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11141A]"
            style={{ backgroundColor: activeTheme.accentColor === 'purple' ? '#8B5CF6' : activeTheme.accentColor === 'blue' ? '#3B82F6' : activeTheme.accentColor === 'pink' ? '#EC4899' : activeTheme.accentColor === 'green' ? '#10B981' : '#F97316' }}
            aria-label="Send message" title="Send message"
          >
            {isSending || (!e2eeReady && !e2eeError) ? <Loader2 size={16} className="animate-spin opacity-70" /> : <Send size={16} className="ml-0.5" strokeWidth={2} />}
          </button>
        ) : (
          <button type="button" onClick={isRecording ? stopRecording : startRecording}
              className={`w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full transition-all hover:opacity-90 hover:scale-102 active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11141A] ${isRecording ? "bg-[#F04438] text-white animate-pulse" : "text-white"}`}
            style={{ backgroundColor: activeTheme.accentColor === 'purple' ? '#8B5CF6' : activeTheme.accentColor === 'blue' ? '#3B82F6' : activeTheme.accentColor === 'pink' ? '#EC4899' : activeTheme.accentColor === 'green' ? '#10B981' : '#F97316' }}
            aria-label={isRecording ? "Stop recording" : "Record voice message"} title={isRecording ? "Stop recording" : "Record voice message"}
          >
            {isRecording ? <Square size={16} className="fill-current" /> : <Mic size={18} strokeWidth={2} />}
          </button>
        )}
      </div>
    </form>
  );
}
