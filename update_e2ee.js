const fs = require('fs');
let file = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

file = file.replace(
`  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();`,
`  const [error, setError] = useState<string | null>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const supabase = createClient();`
);

file = file.replace(
`        } else if (!profile?.public_key) {
          // Sync existing local key to profile if missing
          const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
          await supabase.from('profiles').update({ public_key: pubKeyB64 }).eq('id', profile!.id);
        }
      } catch (err) {
        console.error("E2EE Identity init failed:", err);
      }
    }
    initIdentity();
  }, [profile]);`,
`        } else if (!profile?.public_key) {
          // Sync existing local key to profile if missing
          const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
          await supabase.from('profiles').update({ public_key: pubKeyB64 }).eq('id', profile!.id);
        }
        setIdentityReady(true);
      } catch (err) {
        console.error("E2EE Identity init failed:", err);
      }
    }
    initIdentity();
  }, [profile]);`
);

file = file.replace(
`  // Load or create conversation key
  useEffect(() => {
    if (!profile || !conversationId) return;

    async function loadConvKey() {`,
`  // Load or create conversation key
  useEffect(() => {
    if (!profile || !conversationId || !identityReady) return;

    async function loadConvKey() {`
);

file = file.replace(
`    }

    loadConvKey();
  }, [profile, conversationId, supabase]);`,
`    }

    loadConvKey();
  }, [profile, conversationId, supabase, identityReady]);`
);

fs.writeFileSync('src/hooks/useE2EE.ts', file);
