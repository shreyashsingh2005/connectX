import { create } from 'zustand';
import { Profile, UserSettings } from '@/types';

interface AuthState {
  profile: Profile | null;
  settings: UserSettings | null;
  isLoaded: boolean;
  authError: string | null;
  setProfile: (profile: Profile | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  setIsLoaded: (loaded: boolean) => void;
  setAuthError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(set => ({
  profile: null,
  settings: null,
  isLoaded: false,
  authError: null,
  setProfile: profile => set({ profile }),
  setSettings: settings => set({ settings }),
  setIsLoaded: isLoaded => set({ isLoaded }),
  setAuthError: authError => set({ authError }),
  reset: () => set({ profile: null, settings: null, isLoaded: false, authError: null }),
}));
