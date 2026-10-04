const fs = require('fs');
let content = fs.readFileSync('src/hooks/useAuth.ts', 'utf8');

// We'll replace the updateOnlineStatus function.
const oldFunc = `const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!profile) return;
    await supabase
      .from('profiles')
      .update({ is_online: isOnline, last_seen: new Date().toISOString() })
      .eq('id', profile.id);
  }, [profile, supabase]);`;

const newFunc = `const sessionTokenRef = useRef<string | null>(null);

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
        fetch(\`\${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.\${profile.id}\`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': \`Bearer \${sessionTokenRef.current}\`,
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
  }, [profile, supabase]);`;

// Import useRef if it's missing
if (!content.includes('useRef')) {
  content = content.replace('useState, useEffect, useCallback', 'useState, useEffect, useCallback, useRef');
}

content = content.replace(oldFunc, newFunc);
fs.writeFileSync('src/hooks/useAuth.ts', content);
