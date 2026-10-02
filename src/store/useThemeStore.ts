import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

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
  
  setGlobalTheme: (updates: Partial<ThemePreferences>, userId?: string) => void;
  setChatOverride: (conversationId: string, updates: Partial<ThemePreferences> | null, userId?: string) => void;
  fetchServerPreferences: (userId: string) => Promise<void>;
  
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
      
      setGlobalTheme: (updates, userId) => {
        set((state) => ({ globalTheme: { ...state.globalTheme, ...updates } }));
        if (userId) {
          const supabase = createClient();
          const { globalTheme } = get();
          // Background sync
          supabase.from('user_theme_preferences').upsert({
            user_id: userId,
            theme_id: globalTheme.themeId,
            background_id: globalTheme.backgroundId,
            accent_id: globalTheme.accentColor,
            background_intensity: globalTheme.backgroundIntensity,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' }).then(({error}) => {
             if (error) console.error('Failed to sync global theme', error);
          });
        }
      },
      
      setChatOverride: (conversationId, updates, userId) => {
        set((state) => {
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
        });

        if (userId) {
          const supabase = createClient();
          if (updates === null) {
            supabase.from('chat_theme_preferences')
              .delete()
              .eq('user_id', userId)
              .eq('conversation_id', conversationId)
              .then(({error}) => {
                if (error) console.error('Failed to delete chat theme override', error);
              });
          } else {
            const override = get().chatOverrides[conversationId];
            if (override) {
              supabase.from('chat_theme_preferences').upsert({
                user_id: userId,
                conversation_id: conversationId,
                theme_id: override.themeId,
                background_id: override.backgroundId,
                accent_id: override.accentColor,
                background_intensity: override.backgroundIntensity,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id,conversation_id' }).then(({error}) => {
                if (error) console.error('Failed to sync chat theme override', error);
              });
            }
          }
        }
      },
      
      fetchServerPreferences: async (userId: string) => {
        const supabase = createClient();
        
        try {
          // 1. Fetch Global
          const { data: globalData, error: globalError } = await supabase
            .from('user_theme_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (!globalError && globalData) {
            set(() => ({
              globalTheme: {
                themeId: (globalData.theme_id as ThemeId) || defaultTheme.themeId,
                backgroundId: (globalData.background_id as BackgroundId) || defaultTheme.backgroundId,
                accentColor: (globalData.accent_id as AccentColor) || defaultTheme.accentColor,
                backgroundIntensity: globalData.background_intensity ?? defaultTheme.backgroundIntensity,
              }
            }));
          }

          // 2. Fetch Chat Overrides
          const { data: chatData, error: chatError } = await supabase
            .from('chat_theme_preferences')
            .select('*')
            .eq('user_id', userId);
            
          if (!chatError && chatData && chatData.length > 0) {
            const newOverrides: Record<string, ThemePreferences> = {};
            chatData.forEach(row => {
              newOverrides[row.conversation_id] = {
                themeId: (row.theme_id as ThemeId) || defaultTheme.themeId,
                backgroundId: (row.background_id as BackgroundId) || defaultTheme.backgroundId,
                accentColor: (row.accent_id as AccentColor) || defaultTheme.accentColor,
                backgroundIntensity: row.background_intensity ?? defaultTheme.backgroundIntensity,
              };
            });
            set(() => ({
              chatOverrides: newOverrides
            }));
          }
        } catch (err) {
          console.error("Failed to fetch server preferences", err);
        }
      },

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
