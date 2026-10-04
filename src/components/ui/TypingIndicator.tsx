export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;

  const text = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing`
    : 'Several people are typing';

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 animate-fade-in">
      <div className="flex items-center gap-0.5 bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] rounded-full px-3 py-2 shadow-sm">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-brand block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-brand block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-brand block" />
      </div>
      <span className="text-[11px] text-text-muted italic">{text}...</span>
    </div>
  );
}

