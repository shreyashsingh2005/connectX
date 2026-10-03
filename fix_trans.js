const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// Update uploadAttachment
const uploadAttOld =   const uploadAttachment = async (att: AttachmentPreviewType, messageId: string) => {
    if (!profile) return null;
    try {
      const encryptedFile = await encryptAttachment(att.file);
      const ext = att.file.name.split('.').pop();
      const path = \\/\/\.\.enc\;
      
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
      toast.error('Failed to upload attachment securely');
      return null;
    }
  };;

const uploadAttNew =   const uploadAttachment = async (att: AttachmentPreviewType, messageId: string) => {
    if (!profile) throw new Error('Not authenticated');
    const encryptedFile = await encryptAttachment(att.file);
    const ext = att.file.name.split('.').pop();
    const path = \\/\/\.\.enc\;
    
    const { error: uploadErr } = await supabase.storage
      .from('attachments')
      .upload(path, encryptedFile, { contentType: 'application/octet-stream' });
      
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(path);

    return { url: publicUrl, path };
  };;

content = content.replace(uploadAttOld, uploadAttNew);

const transactionOld =       const { data: newMessage, error: insertError } = await supabase
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

      updateMessage(conversationId, tempId, {
        ...newMessage,
        status: 'sent',
        sender: profile,
        decrypted_content: contentText || null,
      });

      for (const att of savedAttachments) {
        const uploadRes = await uploadAttachment(att, tempId);
        if (uploadRes) {
          await supabase.from('attachments').insert({
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
      };

const transactionNew =       // 1. Upload attachments FIRST
      const uploadedAttachments = [];
      for (const att of savedAttachments) {
        const uploadRes = await uploadAttachment(att, tempId);
        uploadedAttachments.push({
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

      updateMessage(conversationId, tempId, {
        ...newMessage,
        status: 'sent',
        sender: profile,
        decrypted_content: contentText || null,
      });;

content = content.replace(transactionOld, transactionNew);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
