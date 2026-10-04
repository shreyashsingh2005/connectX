const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supaA = createClient(supabaseUrl, supabaseKey);
const supaB = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const emailA = `test_a_${Date.now()}@example.com`;
  const emailB = `test_b_${Date.now()}@example.com`;
  const pass = 'Password123!';

  console.log('Signing up User A...');
  const { data: authA, error: errA } = await supaA.auth.signUp({
    email: emailA, password: pass,
    options: { data: { username: 'test_a', display_name: 'Test A' } }
  });
  if (errA) return console.error('A setup fail:', errA);
  const uidA = authA.user.id;

  console.log('Signing up User B...');
  const { data: authB, error: errB } = await supaB.auth.signUp({
    email: emailB, password: pass,
    options: { data: { username: 'test_b', display_name: 'Test B' } }
  });
  if (errB) return console.error('B setup fail:', errB);
  const uidB = authB.user.id;

  // Wait for profiles to be created via triggers
  await new Promise(r => setTimeout(r, 1000));

  console.log('A starts conversation with B...');
  const { data: convId, error: errConv } = await supaA.rpc('start_direct_conversation', { other_user_id: uidB });
  if (errConv) return console.error('Start conv fail:', errConv);
  console.log('Conversation ID:', convId);

  console.log('A blocks B...');
  const { error: blockErr } = await supaA.from('blocked_users').insert({ blocker_id: uidA, blocked_id: uidB });
  if (blockErr) return console.error('Block fail:', blockErr);
  console.log('Blocked successfully.');

  console.log('B attempts to send message to A...');
  const { data: msgRes, error: msgErr } = await supaB.from('messages').insert({
    conversation_id: convId,
    sender_id: uidB,
    type: 'text',
    status: 'sent',
    content: 'Hello from B!'
  });

  if (msgErr) {
    console.log('EXPECTED BEHAVIOR - Message rejected:', msgErr);
  } else {
    console.error('CRITICAL FAILURE - Message accepted by database!', msgRes);
  }

  console.log('A attempts to send message to B (Symmetric Block test)...');
  const { error: msgErrA } = await supaA.from('messages').insert({
    conversation_id: convId,
    sender_id: uidA,
    type: 'text',
    status: 'sent',
    content: 'Hello from A!'
  });

  if (msgErrA) {
    console.log('EXPECTED BEHAVIOR - A cannot send either:', msgErrA);
  } else {
    console.error('CRITICAL FAILURE - A could send a message!', msgErrA);
  }
}

runTest();
