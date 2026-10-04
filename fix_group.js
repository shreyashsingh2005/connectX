const fs = require('fs');
let content = fs.readFileSync('src/components/modals/GroupChatModal.tsx', 'utf8');
content = content.replace(
  `// Create group conversation
        const { data: conv, error } = await supabase.from('conversations').insert({
          type: 'group',
          name: groupName.trim(),
          created_by: profile.id,
        }).select().single();
        if (error) throw error;
  
        // Add all members (creator as owner, others as members)
        const members = [
          { conversation_id: conv.id, user_id: profile.id, role: 'owner' },
          ...selected.map(u => ({ conversation_id: conv.id, user_id: u.id, role: 'member' })),
        ];
        await supabase.from('conversation_members').insert(members);`,
  `// Create group conversation via secure RPC
        const memberIds = selected.map(u => u.id);
        const { data: convId, error } = await supabase.rpc('create_group_conversation', {
          group_name: groupName.trim(),
          member_ids: memberIds
        });
        if (error) throw error;
        const conv = { id: convId };`
);
fs.writeFileSync('src/components/modals/GroupChatModal.tsx', content);
