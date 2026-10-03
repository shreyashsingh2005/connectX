'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useUIStore } from '@/store/useUIStore';
import { useThemeStore, ThemeId } from '@/store/useThemeStore';
import { useTheme } from 'next-themes';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { ProfilePanel } from '@/components/chat/ProfilePanel';
import { Conversation } from '@/types';
import { Loader2 } from 'lucide-react';

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}


const themeColors: Record<ThemeId, { light: string, dark: string }> = {
  'connect-purple': { light: '#FBFBFD', dark: '#0B0D12' },
  'midnight': { light: '#F0F4F8', dark: '#0A101D' },
  'ocean': { light: '#F0F9FF', dark: '#081729' },
  'minimal': { light: '#FFFFFF', dark: '#000000' },
  'amoled': { light: '#FFFFFF', dark: '#000000' },
  'lavender': { light: '#F5F3FF', dark: '#120F1D' },
  'mint': { light: '#ECFDF5', dark: '#061E16' },
  'sunset': { light: '#FFF7ED', dark: '#1E120A' },
  'rose': { light: '#FFF1F2', dark: '#1E0C10' },
  'aurora': { light: '#F0FDF4', dark: '#0A1A12' },
  'graphite': { light: '#F8FAFC', dark: '#0F172A' },
  'soft-sky': { light: '#F0F9FF', dark: '#0B1521' }
};

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const storeConversation = useChatStore(s => s.conversations.find(c => c.id === conversationId));
  const [localConversation, setLocalConversation] = useState<Conversation | null>(null);
  const conversation = storeConversation || localConversation;
  const [loading, setLoading] = useState(!conversation);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const setActiveConversationId = useChatStore(s => s.setActiveConversationId);
  const addConversation = useChatStore(s => s.addConversation);
  const showProfilePanel = useUIStore(s => s.showProfilePanel);
  const { resolvedTheme } = useTheme();
  
  const activeTheme = useThemeStore(s => s.getEffectiveTheme(conversationId));

const getAccentHex = (color: string | undefined) => {
    switch(color) {
      case 'blue': return '#3B82F6';
      case 'pink': return '#EC4899';
      case 'green': return '#10B981';
      case 'orange': return '#F97316';
      case 'purple':
      default: return '#8B5CF6';
    }
  };

  const accentHex = getAccentHex(activeTheme?.accentColor);
  const cssVariables = {
    '--chat-outgoing-bg': accentHex,
    '--chat-outgoing-text': '#FFFFFF',
    '--chat-outgoing-muted': 'rgba(255, 255, 255, 0.8)',
    '--chat-outgoing-border': 'rgba(255, 255, 255, 0.15)',
    '--chat-incoming-bg': resolvedTheme === 'dark' ? '#151922' : '#FFFFFF',
    '--chat-incoming-text': resolvedTheme === 'dark' ? '#F5F7FA' : '#101828',
    '--chat-incoming-muted': resolvedTheme === 'dark' ? '#98A2B3' : '#667085',
    '--chat-incoming-border': resolvedTheme === 'dark' ? '#252A34' : '#EAECF0',
    backgroundColor: resolvedTheme === 'dark' ? (themeColors[activeTheme?.themeId || 'connect-purple']?.dark || '#0B0D12') : (themeColors[activeTheme?.themeId || 'connect-purple']?.light || '#FBFBFD')
  } as React.CSSProperties;
  


  useEffect(() => {
    setActiveConversationId(conversationId);
    loadConversation();
    return () => setActiveConversationId(null);
  }, [conversationId]);

  async function loadConversation() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('conversations')
        .select(`
          *,
          members:conversation_members(
            id, user_id, role, joined_at, last_read_at, is_pinned, is_muted, is_archived,
            profile:profiles(id, username, display_name, avatar_url, bio, is_online, last_seen)
          )
        `)
        .eq('id', conversationId)
        .single();

      if (err) {
        setError('Conversation not found or access denied');
        return;
      }

      // Verify user is a member
      const isMember = data.members.some((m: { user_id: string }) => m.user_id === profile.id);
      if (!isMember) {
        setError('You do not have access to this conversation');
        return;
      }

      // Get other member for direct conversations
      const otherMember = data.type === 'direct'
        ? data.members.find((m: { user_id: string }) => m.user_id !== profile.id)?.profile
        : undefined;

      const enriched = { ...data, other_member: otherMember };
      setLocalConversation(enriched);
      if (!storeConversation) addConversation(enriched);
    } catch {
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 z-10 overflow-hidden relative bg-[#F8FAFC] dark:bg-[#0B0D12]">
        {/* Header Skeleton */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-[#252A34] bg-white/80 dark:bg-[#0B0D12]/80 min-h-[64px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:hidden bg-gray-200 dark:bg-[#1A1E29] rounded-xl animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1A1E29] animate-pulse" />
              <div className="flex flex-col gap-1.5">
                <div className="w-24 h-4 bg-gray-200 dark:bg-[#1A1E29] rounded animate-pulse" />
                <div className="w-16 h-3 bg-gray-200 dark:bg-[#1A1E29] rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1A1E29] animate-pulse hidden md:block" />
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1A1E29] animate-pulse hidden md:block" />
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1A1E29] animate-pulse" />
          </div>
        </header>

        {/* Message List Skeleton */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#1A1E29] animate-pulse flex-shrink-0" />
            <div className="w-[60%] max-w-[280px] h-[80px] rounded-[18px] bg-gray-200 dark:bg-[#1A1E29] animate-pulse" />
          </div>
          <div className="flex gap-2 flex-row-reverse mt-6">
            <div className="w-[45%] max-w-[220px] h-[60px] rounded-[18px] bg-[#8B5CF6]/10 animate-pulse" />
          </div>
          <div className="flex gap-2 mt-6">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#1A1E29] animate-pulse flex-shrink-0" />
            <div className="w-[70%] max-w-[320px] h-[100px] rounded-[18px] bg-gray-200 dark:bg-[#1A1E29] animate-pulse" />
          </div>
        </div>

        {/* Composer Skeleton */}
        <div className="px-4 py-3 bg-white/80 dark:bg-[#0B0D12]/80 border-t border-gray-200 dark:border-[#252A34] min-h-[72px]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="w-full h-[44px] rounded-[20px] bg-gray-200 dark:bg-[#1A1E29] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">{error || 'Conversation not found'}</p>
        <button onClick={() => router.push('/chat')} className="text-[#8B5CF6] text-sm hover:underline">
          Back to chats
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 min-w-0 overflow-hidden">
      {/* Chat area */}
      
      <div 
        className="flex flex-col flex-1 min-w-0 overflow-hidden relative"
        style={cssVariables}
      >
        {(activeTheme?.backgroundId || 'solid') !== 'solid' && (
          <div 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{ 
              WebkitMaskImage: `url('/patterns/${(activeTheme?.backgroundId || 'solid')}.svg')`, maskImage: `url('/patterns/${(activeTheme?.backgroundId || 'solid')}.svg')`, WebkitMaskSize: '100px 100px', maskSize: '100px 100px', backgroundColor: resolvedTheme === 'dark' ? 'white' : 'black',
              opacity: (activeTheme?.backgroundIntensity || 100) / 100,
              color: resolvedTheme === 'dark' ? 'white' : 'black'
            }} 
          />
        )}
        <div className="flex flex-col flex-1 z-10 overflow-hidden relative chat-open-enter">
          <ChatHeader conversation={conversation!} />
          <MessageList conversationId={conversationId} />
          <MessageComposer conversationId={conversationId} />
        </div>
      </div>


      {/* Profile panel - desktop */}
      {showProfilePanel && (
        <div className="hidden lg:flex">
          <ProfilePanel conversation={conversation!} />
        </div>
      )}

      {/* Profile panel - mobile drawer */}
      {showProfilePanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => useUIStore.getState().setShowProfilePanel(false)} />
          <div className="relative h-full animate-slide-in-right">
            <ProfilePanel conversation={conversation!} />
          </div>
        </div>
      )}
    </div>
  );
}
