import { create } from 'zustand';
import { Conversation, Message, TypingUser } from '@/types';

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
    set(state => ({ messages: { ...state.messages, [conversationId]: messages } })),
  addMessage: (conversationId, message) =>
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),
  updateMessage: (conversationId, messageId, updates) =>
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(m =>
          m.id === messageId ? { ...m, ...updates } : m
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
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...messages, ...(state.messages[conversationId] || [])],
      },
    })),
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
