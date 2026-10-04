const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const updatedBlockCheck = `
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

    const channel = supabase.channel(\`blocks:\${conversationId}\`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_users' }, () => {
        checkBlock();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, profile]);
`;

const regex = /const \[isBlocked, setIsBlocked\] = useState\(false\);[\s\S]*?\}, \[conversationId, profile\]\);/;
content = content.replace(regex, updatedBlockCheck.trim());

fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
