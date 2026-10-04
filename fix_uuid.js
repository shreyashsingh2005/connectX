const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
  fs.writeFileSync(path, content);
};

fixFile('supabase/migrations/20261004120000_secure_blocks.sql');
fixFile('supabase/migrations/20261004120100_pinned_messages.sql');
