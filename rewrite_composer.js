const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const newHandleSend = `
  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const contentText = text.trim();
    if (!contentText && attachments.length === 0) return;
    if (!profile || isSending || isSubmittingRef.current) return;
    
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
  }`;

// Use regex to replace the function entirely
const funcRegex = /async function handleSend\([^)]*\)\s*\{[\s\S]*?(?=\n\s*const handleKeyDown)/;
code = code.replace(funcRegex, newHandleSend + '\n\n');
fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Composer updated successfully');
