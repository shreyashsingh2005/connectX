'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { createClient } from '@/lib/supabase/client';
import { AttachmentPreview as AttachmentPreviewType } from '@/types';
import { cn, validateFile, getFileType, formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Send,
  Paperclip,
  Smile,
  X,
  FileText,
  Mic,
  Square,
  Image as ImageIcon,
  Loader2, Plus} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useE2EE } from '@/hooks/useE2EE';
import { useTheme } from 'next-themes';
import { useThemeStore } from '@/store/useThemeStore';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface MessageComposerProps {
  conversationId: string;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreviewType[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();
  const { resolvedTheme } = useTheme();
  const profile = useAuthStore(s => s.profile);
  const activeTheme = useThemeStore(s => s.getEffectiveTheme)(conversationId);
  const { isReady: e2eeReady, encrypt, encryptAttachment } = useE2EE(conversationId);
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

  // Typing indicator
  const sendTypingStatus = useCallback(async (typing: boolean) => {
    if (!profile) return;
    const channel = (window as any).__chat_channel;
    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: typing ? 'typing' : 'stop_typing',
          payload: { userId: profile.id, username: profile.display_name },
        });
      } catch (e) {}
    }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  };

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }
      const fileType = getFileType(file.type);
      const preview: AttachmentPreviewType = {
        id: uuidv4(),
        file,
        preview: fileType === 'image' ? URL.createObjectURL(file) : '',
        type: fileType,
      };
      setAttachments(prev => [...prev, preview]);
    });
  };

  // Voice Recording
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `VoiceMessage_${Date.now()}.webm`, { type: 'audio/webm' });
        
        const previewUrl = URL.createObjectURL(audioBlob);
        const preview: AttachmentPreviewType = {
          id: uuidv4(),
          file,
          preview: previewUrl,
          type: 'audio',
        };
        setAttachments(prev => [...prev, preview]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      toast.error('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = []; // clear to discard
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    processFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter(a => a.id !== id);
    });
  };

  const uploadAttachment = async (att: AttachmentPreviewType, messageId: string): Promise<{url: string, path: string} | null> => {
    const ext = att.file.name.split('.').pop();
    const path = `${conversationId}/${messageId}/${att.id}.${ext}`;
    
    let encryptedBlob: Blob;
    try {
      encryptedBlob = await encryptAttachment(att.file);
    } catch (e) {
      console.error('File encryption failed', e);
      return null;
    }
    
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, encryptedBlob);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(path);
    
    return { url: publicUrl, path };
  };

  async function handleSend() {
    const content = text.trim();
    if (!content && attachments.length === 0) return;
    if (!profile || isSending) return;

    setIsSending(true);
    const tempId = uuidv4();

    // Optimistic message
    const optimisticMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: profile.id,
      content: content || null,
      type: attachments.length > 0 ? (attachments[0].type as 'image' | 'video' | 'audio' | 'document') : 'text' as const,
      status: 'sending' as const,
        decrypted_content: content || null,
      reply_to_id: replyToMessage?.id || null,
      forwarded_from_id: null,
      is_edited: false,
      is_deleted: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: profile,
      reply_to: replyToMessage || undefined,
      attachments: [],
      reactions: [],
    };

    addMessage(conversationId, optimisticMessage);
    setText('');
    setReplyToMessage(null);
    const sentAttachments = [...attachments];
    setAttachments([]);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    sendTypingStatus(false);

    try {
      // Insert message
      let finalContent = content || null;
      if (finalContent) {
        try {
            finalContent = await encrypt(finalContent);
        } catch (e) {
          console.error('Encryption failed', e);
          toast.error('Failed to encrypt message');
          setIsSending(false);
          return;
        }
      }

      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
            id: tempId,
            conversation_id: conversationId,
          sender_id: profile.id,
          content: finalContent,
          type: sentAttachments.length > 0 ? getFileType(sentAttachments[0].file.type) : 'text',
          status: 'sent',
          reply_to_id: replyToMessage?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload attachments
      for (const att of sentAttachments) {
        const uploadRes = await uploadAttachment(att, newMessage.id);
        if (uploadRes) {
            const { url, path } = uploadRes;
          await supabase.from('attachments').insert({
            message_id: newMessage.id,
            conversation_id: conversationId,
            user_id: profile.id,
            file_name: att.file.name,
            file_size: att.file.size,
            mime_type: att.file.type,
            storage_path: path,
            url,
          });
        }
      }

      // Update conversation last_message_id
        await supabase.from('conversations').update({ last_message_id: newMessage.id, last_message_at: newMessage.created_at }).eq('id', conversationId);

        // Replace optimistic with real
        updateMessage(conversationId, tempId, { 
          ...newMessage, 
          status: 'sent',
          sender: profile,
          decrypted_content: content || null
        });
    } catch (error) {
      console.error('Send error:', error);
      updateMessage(conversationId, tempId, { status: 'failed' });
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
      <div
        className="border border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#11141A] shadow-md rounded-[24px] flex-shrink-0 px-3 py-2.5 relative mx-2 md:mx-4 mb-2 md:mb-4 mt-2" style={{ marginBottom: 'calc(max(env(safe-area-inset-bottom), 8px))' }}

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
            <p className="text-[12px] font-medium text-[#8B5CF6]">{replyToMessage.sender?.display_name}</p>
            <p className="text-[12px] text-[#667085] dark:text-[#98A2B3] truncate">{replyToMessage.content || 'Attachment'}</p>
          </div>
          <button onClick={() => setReplyToMessage(null)} className="text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#252A34] transition-colors">
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
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1 -right-1 bg-[#101828] dark:bg-white text-white dark:text-[#101828] rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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

      <div className="flex items-end gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-[#F8FAFC] dark:hover:bg-[#151922] transition-colors"
          aria-label="Attach file" title="Attach file"
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
            className="flex-1 max-h-32 bg-transparent text-[14px] text-[#101828] dark:text-[#F5F7FA] placeholder:text-[#98A2B3] resize-none py-3 px-3 focus:outline-none custom-scrollbar"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          
            <div className="relative flex items-center justify-center">
              <button type="button" ref={emojiButtonRef}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji" aria-label="Emoji"
                className={`flex w-[38px] h-[38px] flex-shrink-0 items-center justify-center rounded-full transition-colors ${showEmojiPicker ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-[#F8FAFC] dark:hover:bg-[#151922]"}`}
              >
                <Smile size={20} strokeWidth={2} />
              </button>
              

            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
        </div>

        {text.trim() || attachments.length > 0 ? (
          <button type="button" onClick={handleSend}
            disabled={isSending}
            className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full text-white hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
            style={{ backgroundColor: activeTheme.accentColor === 'purple' ? '#8B5CF6' : activeTheme.accentColor === 'blue' ? '#3B82F6' : activeTheme.accentColor === 'pink' ? '#EC4899' : activeTheme.accentColor === 'green' ? '#10B981' : '#F97316' }}
            aria-label="Send message" title="Send message"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" strokeWidth={2.5} />}
          </button>
        ) : (
          <button type="button" onClick={isRecording ? stopRecording : startRecording}
              className={`w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full transition-colors hover:opacity-90 shadow-sm ${isRecording ? "bg-[#F04438] text-white animate-pulse" : "text-white"}`}
            style={{ backgroundColor: activeTheme.accentColor === 'purple' ? '#8B5CF6' : activeTheme.accentColor === 'blue' ? '#3B82F6' : activeTheme.accentColor === 'pink' ? '#EC4899' : activeTheme.accentColor === 'green' ? '#10B981' : '#F97316' }}
            aria-label={isRecording ? "Stop recording" : "Record voice message"} title={isRecording ? "Stop recording" : "Record voice message"}
          >
            {isRecording ? <Square size={16} className="fill-current" /> : <Mic size={18} strokeWidth={2} />}
          </button>
        )}
      </div>
    </div>
  );
}

















