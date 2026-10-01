const fs = require('fs');
let code = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

if (!code.includes('export default function LoginPage')) {
  code += `\n\nexport default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0D12] flex items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]"/></div>}>
      <LoginContent />
    </Suspense>
  );
}\n`;
  fs.writeFileSync('src/app/(auth)/login/page.tsx', code, 'utf8');
  console.log("Fixed LoginPage export");
}
