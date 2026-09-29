'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export function useAuth() {
  const { profile, settings, isLoaded, setProfile, setSettings, setIsLoaded, reset } = useAuthStore();
  const chatReset = useChatStore(s => s.reset);
  const supabase = createClient();

  const loadProfile = useCallback(async (userId: string) => {
    let [profileRes, settingsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_settings').select('*').eq('user_id', userId).single(),
    ]);

    // Self-healing: If profile doesn't exist, try to create it automatically
    if (profileRes.error || !profileRes.data) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const user = userData.user;
        const newProfile = {
          id: user.id,
          username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
          display_name: user.user_metadata?.display_name || 'New User',
          email: user.email || '',
        };
        // Insert profile
        const insertRes = await supabase.from('profiles').insert(newProfile).select().single();
        if (insertRes.data) {
          profileRes = insertRes;
          // Insert settings
          const insertSettings = await supabase.from('user_settings').insert({ user_id: user.id }).select().single();
          if (insertSettings.data) settingsRes = insertSettings;
        }
      }
    }

    if (profileRes.data) setProfile(profileRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    setIsLoaded(true);
  }, [supabase, setProfile, setSettings, setIsLoaded]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setIsLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        reset();
        chatReset();
      } else if (event === 'USER_UPDATED' && session?.user) {
        await loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!profile) return;
    await supabase
      .from('profiles')
      .update({ is_online: isOnline, last_seen: new Date().toISOString() })
      .eq('id', profile.id);
  }, [profile, supabase]);

  return { profile, settings, isLoaded, updateOnlineStatus };
}
