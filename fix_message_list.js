const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

// Compact Date Separator
const oldDateSep = `function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d, yyyy');
  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className="flex-1 h-px bg-gray-200 dark:bg-[rgba(255,255,255,0.04)]" />
      <span className="text-[11px] text-text-muted font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-[rgba(255,255,255,0.04)]" />
    </div>
  );
}`;

const newDateSep = `function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d, yyyy');
  return (
    <div className="flex justify-center my-3">
      <div className="flex items-center justify-center h-[24px] px-3 bg-bg-surface border border-border-subtle rounded-full text-[10px] text-text-sec font-medium shadow-sm">
        {label}
      </div>
    </div>
  );
}`;

code = code.replace(oldDateSep, newDateSep);

// Padding for MessageList
// "Message area: padding: 16px. Mobile: 12px" => `px-3 md:px-4 py-3 md:py-4`
code = code.replace(/<div ref=\{scrollContainerRef\} onScroll=\{handleScroll\} className="flex-1 overflow-y-auto px-4 py-4 relative">/g, '<div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4 relative">');

// Message Skeleton
code = code.replace(/<div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">/g, '<div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4 space-y-2">');

fs.writeFileSync('src/components/chat/MessageList.tsx', code);
console.log("Updated MessageList.tsx");
