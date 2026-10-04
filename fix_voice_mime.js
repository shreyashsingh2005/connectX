const fs = require('fs');

let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const oldStartRecording = `  const startRecording = async () => {
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
        const audioFile = new File([audioBlob], \`Voice_Note_\${Date.now()}.webm\`, { type: 'audio/webm' });
        
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
  };`;

const newStartRecording = `  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = '';
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/ogg;codecs=opus'
      ];
      
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
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
      toast.error('Microphone permission is required.');
      setIsRecording(false);
    }
  };`;

content = content.replace(oldStartRecording, newStartRecording);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
