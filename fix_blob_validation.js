const fs = require('fs');

let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const oldStopLogic = `        if (audioChunksRef.current.length === 0) {
          stream.getTracks().forEach(track => track.stop());
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          setIsRecording(false);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        const ext = actualMimeType.includes('mp4') ? 'mp4' : actualMimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioFile = new File([audioBlob], \`Voice_Note_\${Date.now()}.\${ext}\`, { type: actualMimeType });
        
        setAttachments([{
          id: uuidv4(),
          file: audioFile,
          preview: URL.createObjectURL(audioFile),
          type: 'audio'
        }]);
        
        stream.getTracks().forEach(track => track.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);`;

const newStopLogic = `        // Force calculation of duration locally if needed, but we already have recordingDuration state
        const duration = useChatStore.getState().recordingDuration || 1; // Or fallback
        
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        
        // Development diagnostics
        if (process.env.NODE_ENV === 'development') {
          console.log('[VOICE_RECORDING_DEBUG]', {
            size: audioBlob.size,
            mimeType: actualMimeType,
            chunkCount: audioChunksRef.current.length
          });
        }

        if (audioChunksRef.current.length === 0 || audioBlob.size === 0) {
          toast.error('Recording was empty.');
          stream.getTracks().forEach(track => track.stop());
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          setIsRecording(false);
          return;
        }

        const ext = actualMimeType.includes('mp4') ? 'mp4' : actualMimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioFile = new File([audioBlob], \`Voice_Note_\${Date.now()}.\${ext}\`, { type: actualMimeType });
        
        setAttachments([{
          id: uuidv4(),
          file: audioFile,
          preview: URL.createObjectURL(audioFile),
          type: 'audio'
        }]);
        
        stream.getTracks().forEach(track => track.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);`;

content = content.replace(oldStopLogic, newStopLogic);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
