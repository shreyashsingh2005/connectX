const fs = require('fs');

let settings = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Replace all modals in settings
settings = settings.replace(
  /<div className="fixed inset-0 z-50 flex items-center justify-center bg-black\/40 p-4">/g,
  '<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">'
);
settings = settings.replace(
  /<div className="w-full max-w-sm bg-bg-surface border border-border-subtle rounded-\[16px\] p-5 shadow-xl animate-fade-in">/g,
  '<div className="w-full max-w-sm bg-bg-surface border border-border-subtle rounded-[16px] p-5 shadow-xl animate-in zoom-in-[0.98] duration-150 ease-out">'
);
settings = settings.replace(
  /<div className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-\[16px\] shadow-xl flex flex-col max-h-\[80vh\] animate-fade-in">/g,
  '<div className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-[16px] shadow-xl flex flex-col max-h-[80vh] animate-in zoom-in-[0.98] duration-150 ease-out">'
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', settings);
console.log('Updated Settings Modals');
