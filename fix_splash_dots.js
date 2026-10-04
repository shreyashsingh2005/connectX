const fs = require('fs');

let content = fs.readFileSync('src/components/ui/AppBootScreen.tsx', 'utf8');

const oldDots = /<div className="mt-8 flex items-center gap-1\.5 animate-in fade-in duration-500 fill-mode-both" style=\{\{ animationDelay: '300ms' \}\}>[\s\S]*?<\/div>/;

const newDots = `<div className="mt-8 flex items-center gap-1.5 animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: '300ms' }}>
          <div className="w-[6px] h-[6px] rounded-full bg-brand animate-splash-dot" />
          <div className="w-[6px] h-[6px] rounded-full bg-brand animate-splash-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-[6px] h-[6px] rounded-full bg-brand animate-splash-dot" style={{ animationDelay: '300ms' }} />
        </div>`;

content = content.replace(oldDots, newDots);

fs.writeFileSync('src/components/ui/AppBootScreen.tsx', content);
console.log('Fixed AppBootScreen dots animation');
