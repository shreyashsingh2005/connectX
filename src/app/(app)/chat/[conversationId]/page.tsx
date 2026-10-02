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
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  if (error || !conversation) {
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
        style={{
          backgroundColor: resolvedTheme === 'dark' ? (themeColors[activeTheme.themeId]?.dark || '#0B0D12') : (themeColors[activeTheme.themeId]?.light || '#FBFBFD')
        }}
      >
        {activeTheme.backgroundId !== 'solid' && (
          <div 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{ 
              WebkitMaskImage: `url('/patterns/${activeTheme.backgroundId}.svg')`, maskImage: `url('/patterns/${activeTheme.backgroundId}.svg')`, WebkitMaskSize: '100px 100px', maskSize: '100px 100px', backgroundColor: resolvedTheme === 'dark' ? 'white' : 'black',
              opacity: activeTheme.backgroundIntensity / 100,
              color: resolvedTheme === 'dark' ? 'white' : 'black'
            }} 
          />
        )}
        <div className="flex flex-col flex-1 z-10 overflow-hidden relative">
          <ChatHeader conversation={conversation} />
          <MessageList conversationId={conversationId} />
          <MessageComposer conversationId={conversationId} />
        </div>
      </div>


      {/* Profile panel - desktop */}
      {showProfilePanel && (
        <div className="hidden lg:flex">
          <ProfilePanel conversation={conversation} />
        </div>
      )}

      {/* Profile panel - mobile drawer */}
      {showProfilePanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => useUIStore.getState().setShowProfilePanel(false)} />
          <div className="relative h-full animate-slide-in-right">
            <ProfilePanel conversation={conversation} />
          </div>
        </div>
      )}
    </div>
  );
}
