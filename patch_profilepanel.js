const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

code = code.replace(
  /const \{ data: pData \} = await supabase\.from\('pinned_messages'\)[\s\S]*?if \(pData\) setPinnedMessages\(pData\);/,
  `const { data: pData, error: pError } = await supabase.from('pinned_messages').select('*, messages(*)').eq('conversation_id', conversation.id).order('created_at', { ascending: false });
      if (pError) console.error('[PIN-LOAD] ProfilePanel fetch error:', pError);
      if (pData) setPinnedMessages(pData);`
);

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', code);
console.log('ProfilePanel patched');
