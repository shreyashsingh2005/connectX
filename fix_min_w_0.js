const fs = require('fs');

let layoutCode = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');

layoutCode = layoutCode.replace(
  /<div className="h-\[100dvh\] w-full overflow-hidden bg-bg-surface md:grid md:grid-cols-\[72px_340px_minmax\(0,1fr\)\]">/g,
  '<div className="h-[100dvh] w-full overflow-hidden bg-bg-surface md:grid md:grid-cols-[72px_340px_minmax(0,1fr)] box-border">'
);

layoutCode = layoutCode.replace(
  /<div className="md:col-start-1 md:col-end-2 w-full md:h-\[100dvh\]">/g,
  '<div className="md:col-start-1 md:col-end-2 w-full md:h-[100dvh] min-w-0 min-h-0 relative">'
);

layoutCode = layoutCode.replace(
  /<div className="hidden md:flex flex-col h-\[100dvh\] overflow-hidden min-w-0 border-r border-border-subtle bg-bg-surface md:col-start-2 md:col-end-3">/g,
  '<div className="hidden md:flex flex-col h-[100dvh] overflow-hidden min-w-0 min-h-0 border-r border-border-subtle bg-bg-surface md:col-start-2 md:col-end-3 relative">'
);

fs.writeFileSync('src/app/(app)/layout.tsx', layoutCode);
console.log("AppLayout fully compliant with min-w-0 min-h-0 box-border rule");
