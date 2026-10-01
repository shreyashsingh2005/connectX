const fs = require('fs');

let code = fs.readFileSync('src/app/(auth)/register/page.tsx', 'utf8');

// 1. Add if (loading) return;
code = code.replace(
  /async function handleRegister\(e: React\.FormEvent\) \{\s*e\.preventDefault\(\);/,
  `async function handleRegister(e: React.FormEvent) {\n    e.preventDefault();\n    if (loading) return;`
);

// 2. Handle errors separately
code = code.replace(
  /\} catch \(error: unknown\) \{\s*const message = error instanceof Error \? error\.message : 'Registration failed';\s*toast\.error\(message\);\s*\}/,
  `} catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('rate limit') || error?.status === 429) {
        toast.error('Email sending is temporarily rate-limited. Please try again later.');
      } else if (msg.toLowerCase().includes('already registered')) {
        toast.error('This email is already registered. Please sign in.');
      } else {
        toast.error(msg || 'Registration failed. Please try again.');
      }
    }`
);

fs.writeFileSync('src/app/(auth)/register/page.tsx', code, 'utf8');
console.log("Updated register page");
