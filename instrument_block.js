const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const instrumentedHandleBlock = `
  async function handleBlock() {
    console.log('[BLOCK-1] BUTTON CLICKED');
    console.log('[BLOCK-2] HANDLER START');
    if (!otherUser || !profile) {
      console.error('[BLOCK] Missing user data', { profile, otherUser });
      return;
    }
    console.log('[BLOCK-3] CURRENT USER ID:', profile.id);
    console.log('[BLOCK-4] TARGET USER ID:', otherUser.id);
    
    try {
      if (isBlocked) {
        console.log('[BLOCK-5] RPC/DELETE START');
        const { error, data, status, statusText } = await supabase.from('blocked_users').delete().eq('blocker_id', profile.id).eq('blocked_id', otherUser.id);
        console.log('[BLOCK-6] RPC/DELETE RESPONSE:', { error, data, status, statusText });
        if (error) {
          toast.error('Failed to unblock: ' + error.message);
          return;
        }
        setIsBlocked(false); 
        toast.success('User unblocked');
        console.log('[BLOCK-8] LOCAL BLOCK STATE UPDATED (false)');
      } else {
        console.log('[BLOCK-5] RPC/INSERT START');
        const { error, data, status, statusText } = await supabase.from('blocked_users').insert({ blocker_id: profile.id, blocked_id: otherUser.id });
        console.log('[BLOCK-6] RPC/INSERT RESPONSE:', { error, data, status, statusText });
        if (error) {
          toast.error('Failed to block: ' + error.message);
          return;
        }
        
        // [BLOCK-7] DB ROW VERIFIED
        const { data: verifyData } = await supabase.from('blocked_users').select('id').eq('blocker_id', profile.id).eq('blocked_id', otherUser.id).maybeSingle();
        console.log('[BLOCK-7] DB ROW VERIFIED:', !!verifyData);

        setIsBlocked(true); 
        toast.success('User blocked');
        console.log('[BLOCK-8] LOCAL BLOCK STATE UPDATED (true)');
      }
    } catch (e: any) {
      console.error('[BLOCK] Exception in handler:', e);
      toast.error(e.message || 'Block failed');
    }
  }
`;

content = content.replace(/async function handleBlock\(\) \{[\s\S]*?setIsBlocked\(true\); toast\.success\('User blocked'\);\s*\}\s*\}/, instrumentedHandleBlock.trim());

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', content);
