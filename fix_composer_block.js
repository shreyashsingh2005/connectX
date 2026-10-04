const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const injectBlockState = `
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

const injectBlockRender = `
  if (isBlocked) {
    return (
      <div className="mx-3 mb-2 mt-2 p-3 bg-gray-100 dark:bg-[#1A1F2B] border border-gray-200 dark:border-[#252A34] rounded-xl text-center text-gray-500 text-sm backdrop-blur-sm">
        You cannot send messages to this conversation.
      </div>
    );
  }

  return (
    <div className="relative mx-3 mb-2 mt-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
`;

if (!content.includes('const [isBlocked, setIsBlocked] = useState(false);')) {
  // Inject state
  content = content.replace(
    'const [isTyping, setIsTyping] = useState(false);',
    injectBlockState + '\n  const [isTyping, setIsTyping] = useState(false);'
  );

  // Inject render block
  content = content.replace(
    /return \(\s*<div className="relative mx-3 mb-2 mt-2"[^]*?>/,
    injectBlockRender
  );

  fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
  console.log('Blocked UI state injected.');
}
