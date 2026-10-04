const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// The state injected block starts with `const [isBlocked, setIsBlocked] = useState(false);`
const injectedBlock = `
  const [isBlocked, setIsBlocked] = useState(false);
  useEffect(() => {
    const checkBlock = async () => {
      if (!profile) return;
      const { data: convMembers } = await supabase.from('conversation_members').select('user_id').eq('conversation_id', conversationId);
      if (!convMembers) return;
      const otherMemberId = convMembers.find(m => m.user_id !== profile.id)?.user_id;
      if (!otherMemberId) return;

      const { data: block } = await supabase.from('blocked_users')
        .select('id')
        .or(\`and(blocker_id.eq.\${profile.id},blocked_id.eq.\${otherMemberId}),and(blocker_id.eq.\${otherMemberId},blocked_id.eq.\${profile.id})\`)
        .maybeSingle();

      setIsBlocked(!!block);
    };
    checkBlock();
  }, [conversationId, profile]);
`;

// Remove the wrongly placed block
content = content.replace(injectedBlock, '');

// Re-inject it below `const profile = useAuthStore(s => s.profile);`
content = content.replace(
  'const profile = useAuthStore(s => s.profile);',
  'const profile = useAuthStore(s => s.profile);\n' + injectedBlock
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
