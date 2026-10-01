'use client';

import { useState, useRef, useEffect } from 'react';

import Image from 'next/image';
import { Message, Profile } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EncryptedAttachment } from '@/components/chat/EncryptedAttachment';
import { cn, formatMessageTime, formatFileSize, isOnlyEmojis } from '@/lib/utils';
import {
  Check,
  CheckCheck,
  Clock,
  Edit2,
  Trash2,
  Reply,
  Copy,
  MoreHorizontal,
  Download,
  FileText,
  Music,
  Video,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showSender?: boolean;
  currentUserId: string;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

const QUICK_EMOJIS = ['Ã¢ÂÂ¤Ã¯Â¸Â', 'Ã°Å¸Ëœâ€š', 'Ã°Å¸â€˜Â', 'Ã°Å¸ËœÂ®', 'Ã°Å¸ËœÂ¢', 'Ã°Å¸â„¢Â'];

function DeliveryIcon({ status, isEmojiOnly }: { status: Message['status'], isEmojiOnly?: boolean }) {
  const neutralClass = isEmojiOnly ? "text-gray-400" : "text-white/80 drop-shadow-sm";
  if (status === 'sending') return <Clock className={cn("w-3 h-3", neutralClass)} />;
  if (status === 'sent') return <Check className={cn("w-[14px] h-[14px]", neutralClass)} />;
  if (status === 'delivered') return <CheckCheck className={cn("w-[14px] h-[14px]", neutralClass)} />;
  if (status === 'read') return <CheckCheck className={cn("w-[15px] h-[15px]", isEmojiOnly ? "text-[#38bdf8]" : "text-[#38bdf8] drop-shadow-md brightness-110")} />;
  return null;
}

import { memo } from 'react';

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showSender = false,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const needsDecryption = !!message.content && message.status !== 'sending' && message.status !== 'failed' && message.type !== 'system' && message.decrypted_content === undefined;
  const displayContent = needsDecryption ? null : (message.decrypted_content ?? message.content);
  const isEmojiOnly = isOnlyEmojis(displayContent) && (!message.attachments || message.attachments.length === 0) && !message.reply_to_id;


  if (message.is_deleted) {
    return (
      <div className={cn('flex gap-2 mb-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {!isOwn && showAvatar && (
          <div className="w-8 flex-shrink-0" />
        )}
        <div className={cn(
          'max-w-[85%] md:max-w-[65%] rounded-[16px] px-4 py-2.5 italic text-gray-500 text-sm border',
          isOwn ? 'border-[#2A2F45]' : 'border-gray-200 dark:border-[#252A34]',
          'bg-gray-100 dark:bg-[#11141A]'
        )}>
          Ã°Å¸Å¡Â« This message was deleted
        </div>
      </div>
    );
  }

  const hasReactions = message.reactions && message.reactions.length > 0;
  const groupedReactions = message.reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div
      className={cn('flex gap-2 group', isOwn ? 'flex-row-reverse' : 'flex-row', showAvatar ? 'mt-3 mb-1' : 'mb-1')}
      onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowActions(true);
          setShowEmojiPicker(true);
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          setShowActions(!showActions);
          if (showActions) setShowEmojiPicker(false);
        }}
    >
      {/* Avatar */}
      {!isOwn && showAvatar && (
        <UserAvatar
          src={message.sender?.avatar_url}
          name={message.sender?.display_name || 'User'}
          size="sm"
          className="self-end flex-shrink-0 mb-1"
        />
      )}
      {!isOwn && !showAvatar && <div className="w-7 flex-shrink-0" />}

      <div className={cn('flex flex-col max-w-[85%] md:max-w-[65%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name (group) */}
        {showSender && !isOwn && (
          <span className="text-xs font-medium text-[#8B5CF6] mb-1 ml-1">
            {message.sender?.display_name}
          </span>
        )}

        {/* Reply preview */}
        {message.reply_to && (
          <div className={cn(
            'flex items-start gap-2 mb-1 px-3 py-1.5 rounded-[12px] text-xs border-l-2 border-[#8B5CF6] max-w-full w-full',
            'bg-gray-200 dark:bg-[#151922] text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-300 dark:hover:bg-[#2A3040] transition-colors'
          )}>
            <div className="min-w-0">
              <span className="font-medium text-[#8B5CF6] block">{message.reply_to.sender?.display_name}</span>
              <span className="truncate block">{message.reply_to.content || 'Ã°Å¸â€œÅ½ Attachment'}</span>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          ref={bubbleRef}
          className={cn(
            'relative rounded-[16px] px-4 py-2.5 message-animate',
            isEmojiOnly ? 'bg-transparent shadow-none px-0 py-0' : (isOwn ? 'bg-[#8B5CF6] text-white rounded-br-sm shadow-sm' : 'bg-white dark:bg-[#151922] border border-gray-100 dark:border-[#252A34] text-gray-900 dark:text-[#F5F7FA] rounded-bl-sm shadow-sm'),
          )}
        >
          {/* Text content */}
          {message.type === 'text' && message.content && (
            needsDecryption ? (
              <div className="flex flex-col gap-1.5 w-32 py-1 animate-pulse transition-opacity duration-200">
                <div className={cn("h-2.5 rounded-full", isOwn ? "bg-white/30" : "bg-gray-300 dark:bg-gray-600")}></div>
                <div className={cn("h-2.5 w-4/5 rounded-full", isOwn ? "bg-white/30" : "bg-gray-300 dark:bg-gray-600")}></div>
              </div>
            ) : (
              <p className={cn(
                isEmojiOnly ? 'text-[44px] leading-tight' : 'text-[15px] leading-relaxed whitespace-pre-wrap break-words',
                displayContent?.startsWith('[Unable') && "italic opacity-80 text-[13px]"
              )}>
                {displayContent}
              </p>
            )
          )}

          {/* Image attachment */}
          {message.attachments && message.attachments.length > 0 && (<div className="flex flex-col gap-2 mt-2">{message.attachments.map(att => (<EncryptedAttachment key={att.id} attachment={att} isOwn={isOwn} />))}</div>)}

          {/* Timestamp + status */}
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            {message.is_edited && (
              <span className="text-[10px] opacity-50">edited</span>
            )}
            <span className={`text-[11px] font-medium tracking-wide ${isEmojiOnly ? (isOwn ? 'text-gray-400' : 'text-gray-500') : (isOwn ? 'text-white/90 drop-shadow-sm' : 'text-gray-500 dark:text-[#98A2B3]')}`}>
              {formatMessageTime(message.created_at)}
            </span>
            {isOwn && <DeliveryIcon status={message.status} isEmojiOnly={isEmojiOnly} />}
          </div>
        </div>

        {/* Reactions */}
        {hasReactions && groupedReactions && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-[#151922] border border-gray-300 dark:border-[#252A34] hover:bg-gray-300 dark:hover:bg-[#2A3040] transition-colors text-xs"
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-gray-600 dark:text-gray-400 text-[10px]">{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions (hover) */}
      {showActions && (
        <div className={cn(
          'flex items-center gap-0.5 self-center transition-opacity bg-white dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] shadow-sm p-0.5 z-10',
          isOwn ? 'mr-2 flex-row-reverse' : 'ml-2'
        )}>
          {/* Quick emoji */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-7 h-7 rounded-[8px] flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              Ã°Å¸ËœÅ 
            </button>
            {showEmojiPicker && (
              <div className={cn(
                'absolute bottom-full mb-1 flex gap-1 p-2 bg-gray-100 dark:bg-[#11141A] border border-gray-300 dark:border-[#252A34] rounded-[12px] shadow-xl z-10',
                isOwn ? 'right-0' : 'left-0'
              )}>
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onReact?.(message.id, emoji); setShowEmojiPicker(false); }}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onReply?.(message)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {isOwn && (
            <>
              <button
                onClick={() => onEdit?.(message)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete?.(message.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => navigator.clipboard.writeText(displayContent || '')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.message === next.message &&
    prev.isOwn === next.isOwn &&
    prev.showAvatar === next.showAvatar &&
    prev.showSender === next.showSender &&
    prev.currentUserId === next.currentUserId
  );
});






