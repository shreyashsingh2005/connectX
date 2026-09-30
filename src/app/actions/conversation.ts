'use server'

import { createClient } from '@supabase/supabase-js'

export async function startConversationServer(profileId: string, targetId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Check if direct conversation already exists between these two users
  const { data: existingMembers, error: searchErr } = await supabaseAdmin
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', profileId);
    
  if (!searchErr && existingMembers && existingMembers.length > 0) {
    const convIds = existingMembers.map(m => m.conversation_id);
    const { data: targetMembers } = await supabaseAdmin
      .from('conversation_members')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .eq('user_id', targetId);
      
    if (targetMembers && targetMembers.length > 0) {
      // Find one that is a direct conversation
      const commonConvIds = targetMembers.map(m => m.conversation_id);
      const { data: directConvs } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .in('id', commonConvIds)
        .eq('type', 'direct')
        .limit(1);
        
      if (directConvs && directConvs.length > 0) {
        return directConvs[0].id;
      }
    }
  }

  // 2. Create new conversation
  const { data: newConv, error: convErr } = await supabaseAdmin
    .from('conversations')
    .insert({ type: 'direct' })
    .select()
    .single();

  if (convErr) throw convErr;

  // 3. Add members
  const { error: membersErr } = await supabaseAdmin
    .from('conversation_members')
    .insert([
      { conversation_id: newConv.id, user_id: profileId, role: 'member' },
      { conversation_id: newConv.id, user_id: targetId, role: 'member' }
    ]);

  if (membersErr) throw membersErr;

  return newConv.id;
}
