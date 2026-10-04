'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Conversation, Attachment } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { useE2EE } from '@/hooks/useE2EE';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ProfilePhotoEditor } from '@/components/profile/ProfilePhotoEditor';
import { OnlineIndicator } from '@/components/ui/OnlineIndicator';
import { cn, formatLastSeen } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useChatStore } from '@/store/useChatStore';
import { X, Bell, BellOff, Archive, Flag, Shield, Image as ImageIcon, FileText, Users, Download } from 'lucide-react';

interface ProfilePanelProps {
  conversation: Conversation;
}


function PinnedMessageItem({ pm, conversationId, removePin }: { pm: any, conversationId: string, removePin: (id: string) => void }) {
  const { isReady, decrypt } = useE2EE(conversationId);
  const [decryptedText, setDecryptedText] = useState('Decrypting...');
  const supabase = createClient();

  useEffect(() => {
    if (!isReady || !pm.messages?.content) {
      if (!pm.messages?.content) setDecryptedText(pm.messages?.type === 'image' ? 'Photo' : 'Attachment');
      return;
    }
    async function doDecrypt() {
      try {
        const text = await decrypt(pm.messages.content);
        setDecryptedText(text);
      } catch (e) {
        setDecryptedText('Encrypted Message');
      }
    }
    doDecrypt();
  }, [isReady, pm.messages]);

  return (
    <div className="p-3 bg-[#F9FAFB] dark:bg-[#11141A] rounded-xl relative group">
      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">{decryptedText}</p>
      <div className="flex justify-between items-center text-[10px] text-gray-500">
        <span>{new Date(pm.created_at).toLocaleDateString()}</span>
        <button 
          onClick={async () => {
            try {
              const { error } = await supabase.from('pinned_messages').delete().eq('id', pm.id);
              if (error) throw error;
              removePin(pm.id);
              useChatStore.getState().removePinnedMessageId(conversationId, pm.message_id);
              toast.success('Unpinned message');
            } catch(e: any) {
              toast.error('Failed to unpin');
            }
          }}
          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Unpin
        </button>
      </div>
    </div>
  );
}

function DecryptedMediaThumbnail({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isReady, decryptAttachment } = useE2EE(attachment.conversation_id);
  const supabase = createClient();

  useEffect(() => {
    console.log('[MediaDiagnostics] MEDIA TAB OPEN -> attachment query START for:', attachment.id);
    if (!isReady) {
      console.log('[MediaDiagnostics] E2EE not ready yet for conversation:', attachment.conversation_id);
      return;
    }
    if (!attachment.storage_path) {
      console.log('[MediaDiagnostics] No storage_path found in attachment object', attachment);
      return;
    }
    
    let objectUrl: string | null = null;
    
    async function load() {
      try {
        console.log('[MediaDiagnostics] download START for path:', attachment.storage_path);
        const { data, error } = await supabase.storage.from('attachments').download(attachment.storage_path);
        
        if (error) {
          console.error('[MediaDiagnostics] download FAIL:', error);
          return;
        }
        if (!data) {
          console.error('[MediaDiagnostics] download FAIL: No data returned');
          return;
        }
        
        console.log('[MediaDiagnostics] download SUCCESS, encrypted byte size:', data.size);
        console.log('[MediaDiagnostics] decrypt START with mime_type:', attachment.mime_type);
        
        const decrypted = await decryptAttachment(data, attachment.mime_type);
        
        console.log('[MediaDiagnostics] decrypt SUCCESS, decrypted byte size:', decrypted.size, 'MIME:', decrypted.type);
        
        objectUrl = URL.createObjectURL(decrypted);
        console.log('[MediaDiagnostics] objectURL created:', objectUrl);
        setUrl(objectUrl);
      } catch (e) {
        console.error('[MediaDiagnostics] decrypt FAIL / pipeline error:', e);
      }
    }
    load();
    return () => { 
      if (objectUrl) {
        console.log('[MediaDiagnostics] revoking objectURL:', objectUrl);
        URL.revokeObjectURL(objectUrl); 
      }
    };
  }, [isReady, attachment.storage_path]);

  if (!url) return <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />;
  
  return (
    <>
      <img 
        src={url} 
        alt={attachment.file_name} 
        onClick={() => setIsFullscreen(true)}
        onLoad={() => console.log('[MediaDiagnostics] image onLoad SUCCESS:', attachment.id)}
        onError={(e) => console.error('[MediaDiagnostics] image onError FAIL:', attachment.id, e)}
        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" 
      />
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8" onClick={() => setIsFullscreen(false)}>
          <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-3">
            <a 
              href={url}
              download={attachment.file_name}
              onClick={(e) => e.stopPropagation()}
              className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Download photo"
              title="Download photo"
            >
              <Download size={18} strokeWidth={2} />
            </a>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
              className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Close viewer"
              title="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <img src={url} alt={attachment.file_name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

export function ProfilePanel({ conversation }: ProfilePanelProps) {
  const [mediaAttachments, setMediaAttachments] = useState<Attachment[]>([]);
  const [fileAttachments, setFileAttachments] = useState<Attachment[]>([]);
  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'pinned'>('media');
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const setShowProfilePanel = useUIStore(s => s.setShowProfilePanel);

  const isDirect = conversation.type === 'direct';
  const otherUser = conversation.other_member;
  const name = isDirect ? otherUser?.display_name || 'Unknown' : conversation.name || 'Group';
  const avatarUrl = isDirect ? otherUser?.avatar_url : conversation.avatar_url;
  const isOnline = isDirect ? otherUser?.is_online ?? false : false;
  const bio = isDirect ? otherUser?.bio : conversation.description;
  const memberCount = conversation.members?.length || 0;

  useEffect(() => {
    loadMedia();
    if (isDirect && otherUser && profile) checkBlocked();
  }, [conversation.id]);

  async function loadMedia() {
    const { data: pData, error: pError } = await supabase.from('pinned_messages').select('*, messages(*)').eq('conversation_id', conversation.id).order('created_at', { ascending: false });
      if (pError) console.error('[PIN-LOAD] ProfilePanel fetch error:', pError);
      if (pData) setPinnedMessages(pData);
  
    const { data } = await supabase.from('attachments').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: false }).limit(20);
    if (data) {
      setMediaAttachments(data.filter((a: Attachment) => a.mime_type.startsWith('image/') || a.mime_type.startsWith('video/')));
      setFileAttachments(data.filter((a: Attachment) => !a.mime_type.startsWith('image/') && !a.mime_type.startsWith('video/')));
    }
  }

  async function checkBlocked() {
    if (!otherUser || !profile) return;
    const { data } = await supabase.from('blocked_users').select('id').eq('blocker_id', profile.id).eq('blocked_id', otherUser.id).maybeSingle();
    setIsBlocked(!!data);
  }

  async function handleBlock() {
    console.log('[BLOCK-1] BUTTON CLICKED');
    console.log('[BLOCK-2] HANDLER START');
    if (!otherUser || !profile) {
      console.error('[BLOCK] Missing user data', { profile, otherUser });
      return;
    }
    console.log('[BLOCK-3] CURRENT USER ID:', profile.id);
    console.log('[BLOCK-4] TARGET USER ID:', otherUser.id);
    
    try {
      if (isBlocked) {
        console.log('[BLOCK-5] RPC/DELETE START');
        const { error, data, status, statusText } = await supabase.from('blocked_users').delete().eq('blocker_id', profile.id).eq('blocked_id', otherUser.id);
        console.log('[BLOCK-6] RPC/DELETE RESPONSE:', { error, data, status, statusText });
        if (error) {
          toast.error('Failed to unblock: ' + error.message);
          return;
        }
        setIsBlocked(false); 
        toast.success('User unblocked');
        console.log('[BLOCK-8] LOCAL BLOCK STATE UPDATED (false)');
      } else {
        console.log('[BLOCK-5] RPC/INSERT START');
        const { error, data, status, statusText } = await supabase.from('blocked_users').insert({ blocker_id: profile.id, blocked_id: otherUser.id });
        console.log('[BLOCK-6] RPC/INSERT RESPONSE:', { error, data, status, statusText });
        if (error) {
          toast.error('Failed to block: ' + error.message);
          return;
        }
        
        // [BLOCK-7] DB ROW VERIFIED
        const { data: verifyData } = await supabase.from('blocked_users').select('id').eq('blocker_id', profile.id).eq('blocked_id', otherUser.id).maybeSingle();
        console.log('[BLOCK-7] DB ROW VERIFIED:', !!verifyData);

        setIsBlocked(true); 
        toast.success('User blocked');
        console.log('[BLOCK-8] LOCAL BLOCK STATE UPDATED (true)');
      }
    } catch (e: any) {
      console.error('[BLOCK] Exception in handler:', e);
      toast.error(e.message || 'Block failed');
    }
  }

  async function handleReport() {
    if (!otherUser || !profile) return;
    const reason = window.prompt('Reason (spam, harassment, inappropriate, misinformation, other):');
    if (!reason) return;
    await supabase.from('reports').insert({ reporter_id: profile.id, reported_user_id: otherUser.id, reason: reason as 'spam', description: '' });
    toast.success('Report submitted.');
  }

  async function handleMute() {
    await supabase.from('conversation_members').update({ is_muted: !isMuted }).eq('conversation_id', conversation.id).eq('user_id', profile?.id || '');
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Notifications enabled' : 'Muted');
  }

  const isOwnProfile = profile?.id === otherUser?.id;
  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-[#0E1015] border-l border-[#EAECF0] dark:border-[#252A34] w-72 flex-shrink-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#EAECF0] dark:border-[#252A34]">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Profile Info</h3>
          <button onClick={() => setShowProfilePanel(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex flex-col items-center px-4 py-6 text-center border-b border-[#EAECF0] dark:border-[#252A34]">
            <div className="w-[84px] h-[84px] flex-shrink-0 relative group cursor-pointer" onClick={() => isDirect && isOwnProfile ? setShowPhotoEditor(true) : undefined}>
              <UserAvatar src={avatarUrl} name={name} className="w-full h-full text-2xl shadow-sm" isOnline={isDirect ? isOnline : undefined} />
              {isDirect && isOwnProfile && (
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Edit</span>
                </div>
              )}
            </div>
            <h2 className="mt-3 font-bold text-gray-900 dark:text-white text-base">{name}</h2>
            {isDirect && <div className="flex items-center gap-1.5 mt-1 justify-center">
              <span className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600")} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {isOnline ? 'online' : (otherUser?.last_seen ? formatLastSeen(otherUser.last_seen) : 'offline')}
              </span>
            </div>}
            {!isDirect && <div className="flex items-center gap-1 mt-1"><Users className="w-3 h-3 text-gray-500" /><span className="text-xs text-gray-500">{memberCount} members</span></div>}
            {bio && <p className="text-gray-600 dark:text-gray-400 text-xs mt-2 leading-relaxed">{bio}</p>}
            {isDirect && otherUser?.username && <span className="text-xs text-gray-600 mt-1">@{otherUser.username}</span>}
          </div>
          <div className="p-4 border-b border-[#EAECF0] dark:border-[#252A34] space-y-1">
            <button onClick={handleMute} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:bg-[#11141A] transition-colors">
              {isMuted ? <Bell className="w-4 h-4 text-[#8B5CF6]" /> : <BellOff className="w-4 h-4 text-gray-500" />}
              <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
            </button>
            {isDirect && (
              <>
                <button onClick={handleBlock} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm hover:bg-[#F9FAFB] dark:bg-[#11141A] transition-colors">
                  <Shield className={cn('w-4 h-4', isBlocked ? 'text-green-400' : 'text-yellow-500')} />
                  <span className={isBlocked ? 'text-green-400' : 'text-yellow-500'}>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                </button>
                <button onClick={handleReport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-red-400 hover:bg-red-500/5 transition-colors">
                  <Flag className="w-4 h-4" /><span>Report User</span>
                </button>
              </>
            )}
          </div>
          <div className="p-4">
            <div className="flex gap-1 mb-3 bg-[#F9FAFB] dark:bg-[#11141A] rounded-xl p-1">
              {(['media', 'files', 'pinned'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all', activeTab === tab ? 'bg-[#8B5CF6] text-white' : 'text-gray-500')}>{tab}</button>
              ))}
            </div>
            {activeTab === 'media' && (
              mediaAttachments.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {mediaAttachments.map(att => (
                    <div key={att.id} className="aspect-square rounded-lg overflow-hidden block">
                      <DecryptedMediaThumbnail attachment={att} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6"><p className="text-xs text-gray-600">No media shared yet</p></div>
              )
            )}
            {activeTab === 'files' && (
              fileAttachments.length > 0 ? (
                <div className="space-y-2">
                  {fileAttachments.map(att => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-xl bg-[#F9FAFB] dark:bg-[#11141A] hover:bg-[#EAECF0] dark:hover:bg-[#151922] transition-colors">
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{att.file_name}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6"><p className="text-xs text-gray-600">No files shared yet</p></div>
              )
            )}
            {activeTab === 'pinned' && (
                pinnedMessages.length > 0 ? (
                  <div className="space-y-3">
                    {pinnedMessages.map(pm => (
                      <PinnedMessageItem key={pm.id} pm={pm} conversationId={conversation.id} removePin={(id) => setPinnedMessages(prev => prev.filter(p => p.id !== id))} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6"><p className="text-xs text-gray-600">No pinned messages</p></div>
                )
              )}
              {!isDirect && conversation.members && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Members ({memberCount})</h4>
                <div className="space-y-2">
                  {conversation.members.map(member => (
                    <div key={member.id} className="flex items-center gap-2">
                      <UserAvatar src={member.profile?.avatar_url} name={member.profile?.display_name || 'User'} size="sm" isOnline={member.profile?.is_online} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{member.profile?.display_name}{member.user_id === profile?.id && <span className="text-gray-500"> (you)</span>}</p>
                        {member.role !== 'member' && <span className="text-[10px] text-[#8B5CF6] capitalize">{member.role}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}
    </>
  );
}
