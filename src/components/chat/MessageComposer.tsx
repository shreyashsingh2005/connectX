/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { Smile, Mic, Send, X, FileText, Loader2, Square, Plus, Image as ImageIcon, Video as VideoIcon, Music } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { getFileType, cn } from '@/lib/utils';
import { useE2EE } from '@/hooks/useE2EE';
import { useThemeStore } from '@/store/useThemeStore';
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
  const isTypingRef = useRef(false);
  
  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();
  const { resolvedTheme } = useTheme();
  const profile = useAuthStore(s => s.profile);
  const activeTheme = useThemeStore(s => s.getEffectiveTheme(conversationId));
  const { isReady: e2eeReady, error: e2eeError, e2eeState, encrypt, encryptAttachment, resetConversationKey } = useE2EE(conversationId);
  const replyToMessage = useChatStore(s => s.replyToMessage);
  const setReplyToMessage = useChatStore(s => s.setReplyToMessage);
  const addMessage = useChatStore(s => s.addMessage);
  const updateMessage = useChatStore(s => s.updateMessage);
  const removeMessage = useChatStore(s => s.removeMessage);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showEmojiPicker && emojiPickerRef.current && emojiButtonRef.current) {
        if (!emojiPickerRef.current.contains(target) && !emojiButtonRef.current.contains(target)) {
          setShowEmojiPicker(false);
        }
      }
      if (showAttachmentMenu && attachmentMenuRef.current && attachButtonRef.current) {
        if (!attachmentMenuRef.current.contains(target) && !attachButtonRef.current.contains(target)) {
          setShowAttachmentMenu(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showAttachmentMenu]);

  useEffect(() => {
    const handleRetry = (e: Event) => {
      const customEvent = e as CustomEvent;
      const att = customEvent.detail;
      if (att && att.raw_file) {
        setAttachments([{
          id: att.id,
          file: att.raw_file,
          preview: URL.createObjectURL(att.raw_file),
          type: 'image'
        }]);
        if (att.message_id) {
          removeMessage(conversationId, att.message_id);
        }
      }
    };
    window.addEventListener('retry-message', handleRetry);
    return () => window.removeEventListener('retry-message', handleRetry);
  }, [conversationId, removeMessage]);

  const handleEmojiClick = (emojiData: any) => {
    const cursor = textareaRef.current?.selectionStart ?? text.length;
    const newText = text.slice(0, cursor) + emojiData.emoji + text.slice(cursor);
    setText(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursor + emojiData.emoji.length, cursor + emojiData.emoji.length);
      }
    }, 0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `Voice_Note_${Date.now()}.webm`, { type: 'audio/webm' });
        
        setAttachments([{
          id: uuidv4(),
          file: audioFile,
          preview: URL.createObjectURL(audioFile),
          type: 'audio'
        }]);
        
        stream.getTracks().forEach(track => track.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone access denied:', error);
      toast.error('Microphone access denied or unsupported.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = null; // Prevent the onstop handler from adding the file
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const sendTypingStatus = async (isTypingStatus: boolean) => {
    if (!profile) return;
    const channel = supabase.channel(`room:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: isTypingStatus ? 'typing' : 'stop_typing',
      payload: { userId: profile.id, username: profile.username },
    });
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) sendTypingStatus(false);
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

  const handleAttachmentClick = (type: string) => {
    setShowAttachmentMenu(false);
    if (fileInputRef.current) {
      if (type === 'Photos') fileInputRef.current.accept = 'image/*';
      else if (type === 'Video') fileInputRef.current.accept = 'video/*';
      else if (type === 'Audio') fileInputRef.current.accept = 'audio/*';
      else fileInputRef.current.accept = '*/*';
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newAtts = files.map(file => ({
        id: uuidv4(),
        file,
        preview: URL.createObjectURL(file),
        type: getFileType(file.type) as 'image' | 'video' | 'audio' | 'document'
      }));
      setAttachments(prev => [...prev, ...newAtts]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.accept = '';
    }
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
        .from('attachments')
        .upload(path, encryptedFile, { contentType: 'application/octet-stream' });
        
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(path);

      return { url: publicUrl, path };
    } catch (err) {
      console.error('Attachment upload failed', err);
      throw err;
    }
  };

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const contentText = text.trim();
    if (!contentText && attachments.length === 0) return;
    if (!profile || isSending || isSubmittingRef.current) return;

    if (e2eeState === 'initializing' || e2eeState === 'idle') {
      toast.error('Encryption is still initializing. Please wait a moment and try again.');
      return;
    }
    if (e2eeState === 'error') {
      toast.error(e2eeError ?? 'Encryption failed. Cannot send messages in this conversation.');
      return;
    }
    if (e2eeState === 'waiting_for_device_authorization') {
      toast.error('Cannot send yet — waiting for your other device to grant access.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSending(true);
    const tempId = uuidv4();
    let optimisticAdded = false;

    const savedText = text;
    const savedAttachments = [...attachments];
    const savedReply = replyToMessage;

    try {
      let finalContent: string | null = contentText || null;
      if (finalContent) {
        finalContent = await encrypt(finalContent);
      }

      const optimisticMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: profile.id,
        content: finalContent,
        type: savedAttachments.length > 0
          ? (savedAttachments[0].type as 'image' | 'video' | 'audio' | 'document')
          : 'text' as const,
        status: 'sending' as const,
        decrypted_content: contentText || null,
        reply_to_id: savedReply?.id || null,
        forwarded_from_id: null,
        is_edited: false,
        is_deleted: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: profile,
        reply_to: savedReply || undefined,
        attachments: savedAttachments.map(att => ({
          id: att.id,
          message_id: tempId,
          conversation_id: conversationId,
          user_id: profile.id,
          file_name: att.file.name,
          file_size: att.file.size,
          mime_type: att.file.type,
          storage_path: '', // empty to trigger loading state in EncryptedAttachment
          url: '',
          raw_file: att.file,
          created_at: new Date().toISOString(),
          thumbnail_url: null,
          width: null,
          height: null,
          duration: null,
        })),
        reactions: [],
      };

      addMessage(conversationId, optimisticMessage as any);
      optimisticAdded = true;

      setText('');
      setReplyToMessage(null);
      setAttachments([]);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      sendTypingStatus(false);

      // 1. Upload attachments FIRST
      const uploadedAttachments = [];
      for (const att of savedAttachments) {
        const uploadRes = await uploadAttachment(att, tempId);
        if (uploadRes) {
          uploadedAttachments.push({
            id: att.id || uuidv4(),
            message_id: tempId,
            conversation_id: conversationId,
            user_id: profile.id,
            file_name: att.file.name,
            file_size: att.file.size,
            mime_type: att.file.type,
            storage_path: uploadRes.path,
            url: uploadRes.url,
          });
        }
      }

      // 2. Insert Message to DB
      const { data: newMessage, error: insertError } = await supabase
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

      if (insertError) throw insertError;

      // 3. Insert Attachments to DB
      if (uploadedAttachments.length > 0) {
        const { error: attError } = await supabase.from('attachments').insert(uploadedAttachments);
        if (attError) throw attError;
      }

      // 4. Update local state
      updateMessage(conversationId, tempId, {
        ...newMessage,
        status: 'sent',
        sender: profile,
        decrypted_content: contentText || null,
        attachments: uploadedAttachments, // Provide the attachments so UI renders them immediately
      });
    } catch (err: any) {
      console.error('[Composer] Send failed:', err);
      if (optimisticAdded) {
        updateMessage(conversationId, tempId, { status: 'failed' });
      } else {
        setText(savedText);
        setAttachments(savedAttachments);
        setReplyToMessage(savedReply);
        toast.error(err?.message?.includes('E2EE')
          ? err.message
          : 'Photo couldn\'t be sent');
      }
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
        preview: URL.createObjectURL(file),
        type: getFileType(file.type) as 'image' | 'video' | 'audio' | 'document'
      }));
      setAttachments(prev => [...prev, ...newAtts]);
    }
  };

  const menuItems = [
    { icon: ImageIcon, label: 'Photos', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { icon: VideoIcon, label: 'Video', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { icon: FileText, label: 'Document', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { icon: Music, label: 'Audio', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
  ];

  return (
    <div className="relative mx-3 mb-2 mt-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      {e2eeState === 'error' && (
        <div className="absolute bottom-[100%] left-0 right-0 mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex flex-col gap-2 shadow-lg backdrop-blur-sm z-10 animate-in fade-in slide-in-from-bottom-2">
          <div><strong>Security Error:</strong> Your current device cannot decrypt this conversation. Old messages are unrecoverable.</div>
          <button type="button" onClick={resetConversationKey} className="self-start text-xs font-semibold bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">Reset Secure Session</button>
        </div>
      )}
      
      {e2eeState === 'waiting_for_device_authorization' && (
        <div className="absolute bottom-[100%] left-0 right-0 mb-3 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-sm flex flex-col gap-2 shadow-lg backdrop-blur-sm z-10 animate-in fade-in slide-in-from-bottom-2">
          <div><strong>Connect this device:</strong> Open this chat on your existing trusted device (e.g. Phone) to grant access to this conversation securely.</div>
          <button type="button" onClick={() => { if (confirm('Are you sure? If you lost your original device, resetting will create a new key but all old messages will become permanently unreadable.')) resetConversationKey(); }} className="self-start text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg transition-colors border border-blue-500/30 mt-2">Lost your device? Reset Secure Session</button>
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div ref={attachmentMenuRef} className="absolute bottom-[100%] left-0 mb-3 z-50 w-48 bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[14px] shadow-lg p-2 animate-in fade-in zoom-in-95 duration-150">
          {menuItems.map((item) => (
            <button key={item.label} onClick={() => handleAttachmentClick(item.label)} className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 dark:hover:bg-[#151922] rounded-[10px] transition-colors group text-left">
              <div className={cn("w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors", item.bg, item.color)}>
                <item.icon size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[13px] font-medium text-[#101828] dark:text-[#F5F7FA]">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-[100%] right-0 mb-3 z-50 w-[300px] shadow-lg rounded-[14px] overflow-hidden border border-[#EAECF0] dark:border-[#252A34] animate-in fade-in slide-in-from-bottom-2 duration-150">
          <EmojiPicker 
            onEmojiClick={handleEmojiClick}
            theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
            lazyLoadEmojis={true}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={true}
            width="100%"
            height="350px"
          />
        </div>
      )}

      <form onSubmit={handleSend} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        className="bg-white dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] shadow-sm rounded-[20px] flex-shrink-0 p-1.5 relative transition-all duration-200 focus-within:border-[#8B5CF6]/40 focus-within:ring-[3px] focus-within:ring-[#8B5CF6]/15 group" 
      >
        {replyToMessage && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-[#F7F8FC] dark:bg-[#11141A] rounded-[10px] border border-[#EAECF0] dark:border-[#252A34]">
            <div className="flex-1 border-l-2 border-[#8B5CF6] pl-2 min-w-0">
              <p className="text-[12px] font-medium text-[#8B5CF6] truncate">{replyToMessage.sender?.display_name || 'Someone'}</p>
              <p className="text-[12px] text-[#667085] dark:text-[#98A2B3] truncate">{replyToMessage.decrypted_content || 'Attachment'}</p>
            </div>
            <button type="button" onClick={() => setReplyToMessage(null)} className="text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#252A34] transition-colors"><X size={14} /></button>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto p-1 no-scrollbar">
            {attachments.map(att => (
              <div key={att.id} className={cn("relative group flex-shrink-0 rounded-[10px] border border-[#EAECF0] dark:border-[#252A34] bg-[#F7F8FC] dark:bg-[#11141A] overflow-hidden", att.type === 'audio' ? 'w-48 h-14' : 'w-14 h-14')}>
                {att.type === 'image' ? (
                  <img src={att.preview} alt="" className="w-full h-full object-cover" />
                ) : att.type === 'video' ? (
                  <video src={att.preview} className="w-full h-full object-cover" />
                ) : att.type === 'audio' ? (
                  <div className="w-full h-full flex items-center px-2">
                    <audio src={att.preview} controls className="w-full h-8" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><FileText size={20} className="text-[#667085] dark:text-[#98A2B3]" /></div>
                )}
                <button type="button" onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={12} /></button>
                {att.uploadProgress !== undefined && att.uploadProgress < 100 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"><span className="text-[10px] font-medium text-white">{Math.round(att.uploadProgress)}%</span></div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1.5">
          <button type="button" ref={attachButtonRef} onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className={cn("w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[12px] transition-colors focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[#8B5CF6]/30", showAttachmentMenu ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "text-[#98A2B3] dark:text-[#667085] hover:text-[#101828] dark:hover:text-[#F5F7FA] hover:bg-[#F7F8FC] dark:hover:bg-[#11141A]")}
          >
            <Plus size={20} strokeWidth={2} />
          </button>

          <div className="flex-1 min-h-[36px] max-h-[120px] bg-transparent flex items-center px-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isRecording ? `Recording... ${recordingDuration}s` : "Type a message..."}
              disabled={isRecording || isSending || e2eeState === 'initializing' || e2eeState === 'idle' || e2eeState === 'waiting_for_device_authorization' || e2eeState === 'error'}
              className="flex-1 max-h-[120px] bg-transparent text-[14px] text-[#101828] dark:text-[#F5F7FA] placeholder:text-[#98A2B3] resize-none py-2 px-1 focus:outline-none custom-scrollbar leading-relaxed"
              rows={1}
            />
            
            <button type="button" ref={emojiButtonRef} onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn("w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[#8B5CF6]/30", showEmojiPicker ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "text-[#98A2B3] dark:text-[#667085] hover:text-[#101828] dark:hover:text-[#F5F7FA] hover:bg-[#F7F8FC] dark:hover:bg-[#11141A]")}
            >
              <Smile size={18} strokeWidth={2} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
          </div>

          {text.trim() || attachments.length > 0 ? (
            <button type="submit" disabled={isSending || e2eeState === 'initializing' || e2eeState === 'idle' || e2eeState === 'waiting_for_device_authorization' || e2eeState === 'error'}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[12px] text-white hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#8B5CF6]/30 bg-[#8B5CF6]"
            >
              {isSending ? <Loader2 size={16} className="animate-spin opacity-70" /> : <Send size={16} className="ml-0.5" strokeWidth={2} />}
            </button>
          ) : (
            <button type="button" onClick={isRecording ? stopRecording : startRecording}
              className={cn("w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[12px] transition-all hover:opacity-90 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#8B5CF6]/30 text-white", isRecording ? "bg-[#F04438] animate-pulse" : "bg-[#8B5CF6]")}
            >
              {isRecording ? <Square size={16} className="fill-current" /> : <Mic size={18} strokeWidth={2} />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

