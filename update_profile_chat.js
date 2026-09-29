const fs = require('fs');
let file = fs.readFileSync('src/app/(app)/profile/[username]/page.tsx', 'utf8');

file = file.replace(
`  async function handleStartChat() {
    if (!myProfile || !targetProfile) return;
    setIsStartingChat(true);
    try {
      const { data: existingMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', myProfile.id);

      if (existingMembers && existingMembers.length > 0) {
        const convIds = existingMembers.map(m => m.conversation_id);
        const { data: shared } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('user_id', targetProfile.id);

        if (shared && shared.length > 0) {
          router.push('/chat/' + shared[0].conversation_id);
          return;
        }
      }

      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({ type: 'direct' })
        .select()
        .single();
      if (convErr) throw convErr;

      await supabase.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: myProfile.id, role: 'member' },
        { conversation_id: newConv.id, user_id: targetProfile.id, role: 'member' }
      ]);
      router.push('/chat/' + newConv.id);
    } catch (error) {
      toast.error('Failed to start chat');
    } finally {
      setIsStartingChat(false);
    }
  }`,
`  async function handleStartChat() {
    if (!myProfile || !targetProfile) return;
    setIsStartingChat(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', { p_user1_id: myProfile.id, p_user2_id: targetProfile.id });
      if (error) throw error;
      router.push('/chat/' + data);
    } catch (error) {
      toast.error('Failed to start chat');
    } finally {
      setIsStartingChat(false);
    }
  }`
);

fs.writeFileSync('src/app/(app)/profile/[username]/page.tsx', file);
