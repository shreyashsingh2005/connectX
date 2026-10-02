import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'connect-purple' | 'midnight' | 'ocean' | 'minimal' | 'amoled' | 'lavender' | 'mint' | 'sunset' | 'rose' | 'aurora' | 'graphite' | 'soft-sky';
export type BackgroundId = 'solid' | 'dots' | 'circles' | 'waves' | 'grid' | 'aurora-lines';
export type AccentColor = 'purple' | 'blue' | 'pink' | 'green' | 'orange';

export interface ThemePreferences {
  themeId: ThemeId;
  backgroundId: BackgroundId;
  backgroundIntensity: number; // 0 to 100
  accentColor: AccentColor;
}

interface ThemeState {
  globalTheme: ThemePreferences;
  chatOverrides: Record<string, ThemePreferences>;
  
  setGlobalTheme: (updates: Partial<ThemePreferences>) => void;
  setChatOverride: (conversationId: string, updates: Partial<ThemePreferences> | null) => void;
  
  // Helpers
  getEffectiveTheme: (conversationId?: string | null) => ThemePreferences;
}

const defaultTheme: ThemePreferences = {
  themeId: 'connect-purple',
  backgroundId: 'solid',
  backgroundIntensity: 20,
  accentColor: 'purple'
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      globalTheme: defaultTheme,
      chatOverrides: {},
      
      setGlobalTheme: (updates) => set((state) => ({
        globalTheme: { ...state.globalTheme, ...updates }
      })),
      
      setChatOverride: (conversationId, updates) => set((state) => {
        if (updates === null) {
          const newOverrides = { ...state.chatOverrides };
          delete newOverrides[conversationId];
          return { chatOverrides: newOverrides };
        }
        
        const existing = state.chatOverrides[conversationId] || state.globalTheme;
        return {
          chatOverrides: {
            ...state.chatOverrides,
            [conversationId]: { ...existing, ...updates }
          }
        };
      }),
      
      getEffectiveTheme: (conversationId) => {
        const { globalTheme, chatOverrides } = get();
        if (conversationId && chatOverrides[conversationId]) {
          return chatOverrides[conversationId];
        }
        return globalTheme;
      }
    }),
    {
      name: 'connectx-theme-storage'
    }
  )
);
