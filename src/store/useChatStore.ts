import { create } from 'zustand';
import { Conversation, Message, TypingUser } from '@/types';

const STATUS_WEIGHT: Record<string, number> = { sending: 0, sent: 1, delivered: 2, read: 3, failed: -1 };

function mergeMessage(existing: Message, incoming: Partial<Message>): Message {
  const result = { ...existing, ...incoming };
  
  if (existing.status && incoming.status) {
    const existingWeight = STATUS_WEIGHT[existing.status] ?? 0;
    const incomingWeight = STATUS_WEIGHT[incoming.status] ?? 0;
    if (incomingWeight < existingWeight) {
      result.status = existing.status;
    }
  }
  
  if (incoming.reactions && existing.reactions) {
    if (incoming.reactions.length === 0 && existing.reactions.length > 0) {
      result.reactions = existing.reactions;
    }
  }

  if (existing.decrypted_content && !incoming.decrypted_content) {
    result.decrypted_content = existing.decrypted_content;
  }
  
  return result as Message;
}


interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: TypingUser[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  replyToMessage: Message | null;
  searchQuery: string;
  
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  bulkUpdateMessages: (conversationId: string, updates: { id: string; changes: Partial<Message> }[]) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  setTypingUsers: (users: TypingUser[]) => void;
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string, conversationId: string) => void;
  setIsLoadingConversations: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setReplyToMessage: (message: Message | null) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()(set => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  replyToMessage: null,
  searchQuery: '',

  setConversations: conversations => set({ conversations }),
  addConversation: conversation =>
    set(state => ({ conversations: [conversation, ...state.conversations] })),
  updateConversation: (id, updates) =>
    set(state => ({
      conversations: state.conversations.map(c => c.id === id ? { ...c, ...updates } : c),
    })),
  setActiveConversationId: id => set({ activeConversationId: id }),
  setMessages: (conversationId, messages) =>
    set(state => {
      const current = state.messages[conversationId] || [];
      const currentMap = new Map(current.map(m => [m.id, m]));
      
      const merged = messages.map(m => {
        if (currentMap.has(m.id)) {
          return mergeMessage(currentMap.get(m.id)!, m);
        }
        return m;
      });
      
      return { messages: { ...state.messages, [conversationId]: merged } };
    }),
  addMessage: (conversationId, message) =>
    set(state => {
      const current = state.messages[conversationId] || [];
      if (current.some(m => m.id === message.id)) {
        // Merge instead of duplicate
        return {
          messages: {
            ...state.messages,
            [conversationId]: current.map(m => m.id === message.id ? mergeMessage(m, message) : m),
          },
        };
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...current, message],
        },
      };
    }),
  bulkUpdateMessages: (conversationId, updatesList) => set((state) => {
    const messages = state.messages[conversationId] || [];
    const newMessages = [...messages];
    
    let hasChanges = false;
    updatesList.forEach(update => {
      const idx = newMessages.findIndex((m) => m.id === update.id);
      if (idx !== -1) {
        newMessages[idx] = mergeMessage(newMessages[idx], update.changes);
        hasChanges = true;
      }
    });

    if (!hasChanges) return state;

    return {
      messages: {
        ...state.messages,
        [conversationId]: newMessages,
      },
    };
  }),

  updateMessage: (conversationId, messageId, updates) =>
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(m =>
          m.id === messageId ? mergeMessage(m, updates) : m
        ),
      },
    })),
  removeMessage: (conversationId, messageId) =>
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          m => m.id !== messageId
        ),
      },
    })),
  prependMessages: (conversationId, messages) =>
    set(state => {
      const current = state.messages[conversationId] || [];
      const newMap = new Map(current.map(m => [m.id, m]));
      messages.forEach(m => {
        if (newMap.has(m.id)) {
          newMap.set(m.id, mergeMessage(newMap.get(m.id)!, m));
        } else {
          newMap.set(m.id, m);
        }
      });
      // Sort chronologically
      const merged = Array.from(newMap.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return {
        messages: {
          ...state.messages,
          [conversationId]: merged,
        },
      };
    }),
  setTypingUsers: users => set({ typingUsers: users }),
  addTypingUser: user =>
    set(state => ({
      typingUsers: [
        ...state.typingUsers.filter(
          u => u.userId !== user.userId || u.conversationId !== user.conversationId
        ),
        user,
      ],
    })),
  removeTypingUser: (userId, conversationId) =>
    set(state => ({
      typingUsers: state.typingUsers.filter(
        u => !(u.userId === userId && u.conversationId === conversationId)
      ),
    })),
  setIsLoadingConversations: loading => set({ isLoadingConversations: loading }),
  setIsLoadingMessages: loading => set({ isLoadingMessages: loading }),
  setReplyToMessage: message => set({ replyToMessage: message }),
  setSearchQuery: query => set({ searchQuery: query }),
  reset: () =>
    set({
      conversations: [],
      activeConversationId: null,
      messages: {},
      typingUsers: [],
      isLoadingConversations: false,
      isLoadingMessages: false,
      replyToMessage: null,
      searchQuery: '',
    }),
}));
