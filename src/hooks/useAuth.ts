'use client';

import { useEffect, useCallback , useRef} from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useThemeStore } from '@/store/useThemeStore';

export function useAuth() {
  const { profile, settings, isLoaded, setProfile, setSettings, setIsLoaded, reset } = useAuthStore();
  const chatReset = useChatStore(s => s.reset);
  const fetchServerPreferences = useThemeStore(s => s.fetchServerPreferences);
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
          
          // Secure client-side generation
          let hex = '';
          if (typeof window !== 'undefined' && window.crypto) {
            const array = new Uint8Array(4);
            window.crypto.getRandomValues(array);
            hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
          } else {
            hex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
          }
          const tempUsername = `user_${hex}`;
          
          const newProfile = {
            id: user.id,
            username: user.user_metadata?.username || tempUsername,
            username_normalized: user.user_metadata?.username?.toLowerCase() || tempUsername,
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || 'New User',


          email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || null,
        };
        
          // Insert profile with retry
          let profileCreated = false;
          let retries = 3;
          let profileInsertRes = null;
          
          while (!profileCreated && retries > 0) {
            const insertRes = await supabase.from('profiles').insert(newProfile).select().single();
            if (!insertRes.error) {
              profileCreated = true;
              profileInsertRes = insertRes;
            } else if (insertRes.error.code === '23505') {
              // Generate new username and retry
              let newHex = '';
              if (typeof window !== 'undefined' && window.crypto) {
                const array = new Uint8Array(4);
                window.crypto.getRandomValues(array);
                newHex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
              } else {
                newHex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
              }
              const newTemp = `user_${newHex}`;
              newProfile.username = newTemp;
              newProfile.username_normalized = newTemp;
              retries--;
            } else {
              break;
            }
          }
          
          if (profileCreated && profileInsertRes) {
            profileRes = profileInsertRes;

          // Insert settings
          const insertSettings = await supabase.from('user_settings').insert({ user_id: user.id }).select().single();
          if (insertSettings.data) settingsRes = insertSettings;
        }
      }
    }

    if (profileRes.data) setProfile(profileRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    await fetchServerPreferences(userId);
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
        useThemeStore.setState({ globalTheme: { themeId: 'connect-purple', backgroundId: 'solid', backgroundIntensity: 20, accentColor: 'purple' }, chatOverrides: {} });
      } else if (event === 'USER_UPDATED' && session?.user) {
        await loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sessionTokenRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) sessionTokenRef.current = data.session.access_token;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) sessionTokenRef.current = session.access_token;
      else sessionTokenRef.current = null;
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!profile) return;
    // Use keepalive fetch to ensure delivery during browser close/unload
    if (sessionTokenRef.current) {
      try {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${sessionTokenRef.current}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ is_online: isOnline, last_seen: new Date().toISOString() }),
          keepalive: true
        });
      } catch (e) {
        // Fallback
        supabase.from('profiles').update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq('id', profile.id).then();
      }
    } else {
      supabase.from('profiles').update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq('id', profile.id).then();
    }
  }, [profile, supabase]);

  return { profile, settings, isLoaded, updateOnlineStatus };
}
