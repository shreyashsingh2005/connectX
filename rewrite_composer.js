const fs = require('fs');

const code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const returnRegex = /return\s*\(\s*<div\s+className="bg-white[\s\S]*?\);\n\}/;

const newReturn = `return (
    <div
      className="bg-white dark:bg-[#0B0D12] flex-shrink-0 px-4 py-4 pb-[env(safe-area-inset-bottom)] relative"
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <div className="relative flex flex-col bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] shadow-sm focus-within:ring-1 focus-within:ring-[#8B5CF6]/30 focus-within:border-[#8B5CF6]/50 transition-all">
        
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-[100%] right-0 md:right-4 mb-3 z-[50] shadow-xl rounded-[12px] overflow-hidden border border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#0B0D12]">
            <EmojiPicker 
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              lazyLoadEmojis={true}
            />
          </div>
        )}

        {replyToMessage && (
          <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[#EAECF0] dark:border-[#252A34] bg-[#F8FAFC]/50 dark:bg-[#151922]/50 rounded-t-[16px]">
            <div className="flex-1 border-l-2 border-[#8B5CF6] pl-2 min-w-0">
              <p className="text-[12px] font-semibold text-[#8B5CF6]">Replying to {replyToMessage.sender?.display_name}</p>
              <p className="text-[12px] text-[#667085] dark:text-[#98A2B3] truncate">{replyToMessage.content || 'Attachment'}</p>
            </div>
            <button type="button" onClick={() => setReplyToMessage(null)} className="text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Cancel reply">
              <X size={16} />
            </button>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex gap-2 p-2.5 border-b border-[#EAECF0] dark:border-[#252A34] overflow-x-auto no-scrollbar">
            {attachments.map(att => (
              <div key={att.id} className="relative group flex-shrink-0 w-20 h-20 rounded-[10px] border border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#0B0D12] shadow-sm overflow-hidden flex items-center justify-center">
                {att.type === 'image' ? (
                  <img src={att.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileText size={24} className="text-[#667085] dark:text-[#98A2B3]" />
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  aria-label="Remove attachment"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
                {att.uploadProgress !== undefined && att.uploadProgress < 100 && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-[11px] font-medium text-white">{Math.round(att.uploadProgress)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1 p-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[12px] text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Attach files"
          >
            <Paperclip size={20} strokeWidth={2} />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isRecording ? \`Recording... \${recordingDuration}s\` : "Write a message..."}
            disabled={isRecording || isSending}
            className="flex-1 min-h-[40px] max-h-32 bg-transparent text-[15px] text-[#101828] dark:text-[#F5F7FA] placeholder:text-[#98A2B3] resize-none py-2.5 px-2 focus:outline-none custom-scrollbar"
            rows={1}
            style={{ minHeight: '40px' }}
          />
          
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />

          <button
            type="button" 
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[12px] text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Emoji"
          >
            <Smile size={20} strokeWidth={2} />
          </button>

          {text.trim() || attachments.length > 0 ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[12px] bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors shadow-sm disabled:opacity-50"
              aria-label="Send message"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" strokeWidth={2.5} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={\`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[12px] transition-colors \${isRecording ? "bg-[#F04438] text-white animate-pulse shadow-sm" : "text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-black/5 dark:hover:bg-white/5"}\`}
              aria-label={isRecording ? "Stop recording" : "Record voice message"}
            >
              {isRecording ? <Square size={16} className="fill-current" /> : <Mic size={20} strokeWidth={2} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );`;

const newCode = code.replace(returnRegex, newReturn);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', newCode);
console.log("Replaced composer return block");
