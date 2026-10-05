'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useThemeStore } from '@/store/useThemeStore';

export function useAuth() {
  const { profile, settings, isLoaded, authError, setProfile, setSettings, setIsLoaded, setAuthError, reset } = useAuthStore();
  const chatReset = useChatStore(s => s.reset);
  const fetchServerPreferences = useThemeStore(s => s.fetchServerPreferences);
  const supabase = createClient();

  // Prevents multiple simultaneous profile fetches
  const fetchInProgress = useRef(false);

  const loadProfile = useCallback(async (userId: string) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    
    // We haven't loaded yet (or we're retrying), clear previous error if any
    setAuthError(null);

    let attempt = 0;
    const maxAttempts = 4;
    let profileData = null;
    let settingsData = null;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('user_settings').select('*').eq('user_id', userId).single(),
        ]);

        if (profileRes.data) {
          profileData = profileRes.data;
          settingsData = settingsRes.data;
          break; // Success!
        }

        // PGRST116: JSON object requested, multiple (or no) rows returned.
        // For .single(), it means 0 rows (profile doesn't exist).
        if (profileRes.error?.code === 'PGRST116') {
          // Call secure idempotent bootstrap
          const rpcRes = await supabase.rpc('ensure_profile_for_current_user');
          if (rpcRes.error) {
            throw new Error(`BOOTSTRAP_ERROR: ${rpcRes.error.message}`);
          }
          
          attempt++;
          if (attempt < maxAttempts) {
             // Wait a tiny bit before fetching again to ensure replication/transaction commits
             await new Promise(r => setTimeout(r, 400));
             continue;
          } else {
             throw new Error('BOOTSTRAP_TIMEOUT: Could not fetch after bootstrap');
          }
        }

        // If it's another error (e.g. JWT expired during fetch, network down, timeout)
        throw new Error(profileRes.error?.message || 'FETCH_ERROR');

      } catch (err: any) {
        lastError = err;
        attempt++;
        if (attempt < maxAttempts) {
          // Exponential backoff delay
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
        }
      }
    }

    if (profileData) {
      setProfile(profileData);
      if (settingsData) setSettings(settingsData);
      setAuthError(null);
      await fetchServerPreferences(userId);
    } else {
      // Failed to load after all retries
      let errType = 'PROFILE_FETCH_ERROR';
      const errMsg = lastError?.message?.toLowerCase() || '';
      
      if (errMsg.includes('bootstrap_error')) {
        errType = 'PROFILE_BOOTSTRAP_ERROR';
      } else if (errMsg === 'failed to fetch' || errMsg.includes('network')) {
        errType = 'NETWORK_ERROR';
      } else if (errMsg.includes('jwt') || errMsg.includes('session') || errMsg.includes('auth')) {
        errType = 'AUTH_SESSION_ERROR';
      } else if (errMsg.includes('pgrst116')) {
        errType = 'PROFILE_NOT_FOUND';
      }
      setAuthError(errType);
    }

    setIsLoaded(true);
    fetchInProgress.current = false;
  }, [supabase, setProfile, setSettings, setIsLoaded, setAuthError, fetchServerPreferences]);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        setAuthError('AUTH_SESSION_ERROR');
        setIsLoaded(true);
        return;
      }
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setIsLoaded(true);
      }
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Prevent duplicate calls if loadProfile is already handling it
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        reset();
        chatReset();
        useThemeStore.setState({ 
          globalTheme: { themeId: 'connect-purple', backgroundId: 'solid', backgroundIntensity: 20, accentColor: 'purple' }, 
          chatOverrides: {} 
        });
      } else if (event === 'USER_UPDATED' && session?.user) {
        await loadProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase.auth, setAuthError, setIsLoaded, reset, chatReset]);

  // Keep track of the session token for keepalive requests
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

  // Online status management
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!profile) return;
    
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
        supabase.from('profiles').update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq('id', profile.id).then();
      }
    } else {
      supabase.from('profiles').update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq('id', profile.id).then();
    }
  }, [profile, supabase]);

  // Expose loadProfile for manual retries
  const retryProfileLoad = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      setIsLoaded(false); // Trigger loading screen briefly
      await loadProfile(data.session.user.id);
    } else {
      setAuthError('AUTH_SESSION_ERROR');
    }
  }, [supabase, loadProfile, setIsLoaded, setAuthError]);

  return { profile, settings, isLoaded, authError, updateOnlineStatus, retryProfileLoad };
}
