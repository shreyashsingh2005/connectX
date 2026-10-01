const fs = require('fs');

let code = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

// 1. Import useEffect and add state variables for resend
code = code.replace(
  /import \{ useState \} from 'react';/,
  `import { useState, useEffect } from 'react';`
);

code = code.replace(
  /const \[loading, setLoading\] = useState\(false\);/,
  `const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResendVerification() {
    if (resendCooldown > 0 || resending || !email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: \`\${window.location.origin}/auth/callback\`
        }
      });
      if (error) throw error;
      toast.success('Verification email resent! Please check your inbox.');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('rate limit') || error?.status === 429) {
        toast.error('Too many verification emails were requested. Please wait a while before trying again.');
        setResendCooldown(60);
      } else {
        toast.error(msg || 'Failed to resend verification email.');
      }
    } finally {
      setResending(false);
    }
  }`
);

// 2. Add if (loading) return; in handleLogin
code = code.replace(
  /async function handleLogin\(e: React\.FormEvent\) \{\s*e\.preventDefault\(\);\s*if \(!email \|\| !password\) return;/,
  `async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) return;`
);

// 3. Update error handler in handleLogin
code = code.replace(
  /\} catch \(error: unknown\) \{\s*const message = error instanceof Error \? error\.message : 'Login failed';\s*toast\.error\(message\);\s*\}/,
  `} catch (error: any) {
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('not confirmed') || msg.toLowerCase().includes('email is not verified')) {
        setNeedsVerification(true);
        toast.error('Please verify your email address before signing in.');
      } else if (msg.includes('rate limit') || error?.status === 429) {
        toast.error('Login attempts are temporarily rate-limited. Please try again later.');
      } else {
        toast.error(msg || 'Login failed. Please check your credentials.');
      }
    }`
);

// 4. Add the Resend Verification UI inside the form
code = code.replace(
  /<\/form>/,
  `  {needsVerification && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-xl flex flex-col items-center justify-center space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                Your email is not verified yet.
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending || resendCooldown > 0}
                className="text-sm font-medium text-yellow-900 dark:text-yellow-100 bg-yellow-100 dark:bg-yellow-800/40 px-4 py-2 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800/60 transition-colors disabled:opacity-50 disabled:pointer-events-none w-full"
              >
                {resending ? 'Sending...' : resendCooldown > 0 ? \`Resend available in \${resendCooldown}s\` : 'Resend Verification Email'}
              </button>
            </div>
          )}
        </form>`
);

fs.writeFileSync('src/app/(auth)/login/page.tsx', code, 'utf8');
console.log("Updated login page");
