'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Conversation, Attachment } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { OnlineIndicator } from '@/components/ui/OnlineIndicator';
import { cn, formatLastSeen } from '@/lib/utils';
import toast from 'react-hot-toast';
import { X, Bell, BellOff, Archive, Flag, Shield, Image as ImageIcon, FileText, Users } from 'lucide-react';

interface ProfilePanelProps {
  conversation: Conversation;
}

export function ProfilePanel({ conversation }: ProfilePanelProps) {
  const [mediaAttachments, setMediaAttachments] = useState<Attachment[]>([]);
  const [fileAttachments, setFileAttachments] = useState<Attachment[]>([]);
  const [activeTab, setActiveTab] = useState<'media' | 'files'>('media');
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
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
    if (!otherUser || !profile) return;
    if (isBlocked) {
      await supabase.from('blocked_users').delete().eq('blocker_id', profile.id).eq('blocked_id', otherUser.id);
      setIsBlocked(false); toast.success('User unblocked');
    } else {
      await supabase.from('blocked_users').insert({ blocker_id: profile.id, blocked_id: otherUser.id });
      setIsBlocked(true); toast.success('User blocked');
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B0F19] border-l border-gray-200 dark:border-[#252A34] w-72 flex-shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-[#252A34]">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Profile Info</h3>
        <button onClick={() => setShowProfilePanel(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center px-4 py-6 text-center border-b border-gray-200 dark:border-[#252A34]">
          <UserAvatar src={avatarUrl} name={name} size="xl" isOnline={isDirect ? isOnline : undefined} />
          <h2 className="mt-3 font-bold text-gray-900 dark:text-white text-base">{name}</h2>
          {isDirect && <OnlineIndicator isOnline={isOnline} showText lastSeen={otherUser?.last_seen ? formatLastSeen(otherUser.last_seen) : undefined} className="mt-1 justify-center" />}
          {!isDirect && <div className="flex items-center gap-1 mt-1"><Users className="w-3 h-3 text-gray-500" /><span className="text-xs text-gray-500">{memberCount} members</span></div>}
          {bio && <p className="text-gray-600 dark:text-gray-400 text-xs mt-2 leading-relaxed">{bio}</p>}
          {isDirect && otherUser?.username && <span className="text-xs text-gray-600 mt-1">@{otherUser.username}</span>}
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-[#252A34] space-y-1">
          <button onClick={handleMute} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-[#11141A] transition-colors">
            {isMuted ? <Bell className="w-4 h-4 text-[#8B5CF6]" /> : <BellOff className="w-4 h-4 text-gray-500" />}
            <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
          </button>
          {isDirect && (
            <>
              <button onClick={handleBlock} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm hover:bg-gray-100 dark:bg-[#11141A] transition-colors">
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
          <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-[#11141A] rounded-xl p-1">
            {(['media', 'files'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all', activeTab === tab ? 'bg-[#8B5CF6] text-white' : 'text-gray-500')}>{tab}</button>
            ))}
          </div>

          {activeTab === 'media' && (
            mediaAttachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {mediaAttachments.map(att => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden block">
                    <Image src={att.url} alt={att.file_name} width={80} height={80} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-6"><ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-xs text-gray-600">No media shared yet</p></div>
            )
          )}

          {activeTab === 'files' && (
            fileAttachments.length > 0 ? (
              <div className="space-y-2">
                {fileAttachments.map(att => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-[#11141A] hover:bg-gray-200 dark:bg-[#151922] transition-colors">
                    <FileText className="w-5 h-5 text-[#8B5CF6] flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{att.file_name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-6"><FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-xs text-gray-600">No files shared yet</p></div>
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
  );
}


