const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testBlockFlow() {
  const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
    return acc;
  }, {});

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // 1. Create two random users via REST API to ensure clean sessions
  const supaA = createClient(supabaseUrl, supabaseKey);
  const supaB = createClient(supabaseUrl, supabaseKey);

  const emailA = \`test_a_\${Date.now()}@example.com\`;
  const emailB = \`test_b_\${Date.now()}@example.com\`;
  const pass = 'Password123!';

  const { data: authA, error: errA } = await supaA.auth.signUp({ email: emailA, password: pass, options: { data: { username: 'test_a', display_name: 'Test A' } } });
  const { data: authB, error: errB } = await supaB.auth.signUp({ email: emailB, password: pass, options: { data: { username: 'test_b', display_name: 'Test B' } } });

  if (errA || errB) {
    // If fake email fails due to limits, maybe we can use random UUIDs and bypass? No, we need a valid JWT.
    console.log('Signup error:', errA?.message || errB?.message);
    return;
  }

  const uidA = authA.user.id;
  const uidB = authB.user.id;

  console.log('User A:', uidA);
  console.log('User B:', uidB);

  // 2. Start conversation
  const { data: convId, error: convErr } = await supaA.rpc('start_direct_conversation', { other_user_id: uidB });
  console.log('Conversation:', convId, convErr?.message);

  // 3. A blocks B
  const { error: blockErr } = await supaA.from('blocked_users').insert({ blocker_id: uidA, blocked_id: uidB });
  console.log('Block error:', blockErr?.message || 'None');

  // 4. B sends message
  const { data: msgRes, error: msgErr } = await supaB.from('messages').insert({
    conversation_id: convId,
    sender_id: uidB,
    type: 'text',
    status: 'sent',
    content: 'Hello from B!'
  });

  console.log('B message insert error:', msgErr?.message || 'SUCCESS (FAIL!)');
  
  // 5. A sends message
  const { error: msgErrA } = await supaA.from('messages').insert({
    conversation_id: convId,
    sender_id: uidA,
    type: 'text',
    status: 'sent',
    content: 'Hello from A!'
  });

  console.log('A message insert error:', msgErrA?.message || 'SUCCESS (FAIL!)');
}
testBlockFlow();
