import { create } from 'zustand';
import { Profile, UserSettings } from '@/types';

interface AuthState {
  profile: Profile | null;
  settings: UserSettings | null;
  isLoaded: boolean;
  setProfile: (profile: Profile | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  setIsLoaded: (loaded: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(set => ({
  profile: null,
  settings: null,
  isLoaded: false,
  setProfile: profile => set({ profile }),
  setSettings: settings => set({ settings }),
  setIsLoaded: isLoaded => set({ isLoaded }),
  reset: () => set({ profile: null, settings: null, isLoaded: false }),
}));
