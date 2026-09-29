import { create } from 'zustand';

interface UIState {
  showProfilePanel: boolean;
  showNewChatModal: boolean;
  showGroupModal: boolean;
  showSearchModal: boolean;
  showMobileConversations: boolean;
  
  setShowProfilePanel: (show: boolean) => void;
  setShowNewChatModal: (show: boolean) => void;
  setShowGroupModal: (show: boolean) => void;
  setShowSearchModal: (show: boolean) => void;
  setShowMobileConversations: (show: boolean) => void;
  toggleProfilePanel: () => void;
}

export const useUIStore = create<UIState>()(set => ({
  showProfilePanel: false,
  showNewChatModal: false,
  showGroupModal: false,
  showSearchModal: false,
  showMobileConversations: true,

  setShowProfilePanel: show => set({ showProfilePanel: show }),
  setShowNewChatModal: show => set({ showNewChatModal: show }),
  setShowGroupModal: show => set({ showGroupModal: show }),
  setShowSearchModal: show => set({ showSearchModal: show }),
  setShowMobileConversations: show => set({ showMobileConversations: show }),
  toggleProfilePanel: () => set(state => ({ showProfilePanel: !state.showProfilePanel })),
}));
