import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  showText?: boolean;
  lastSeen?: string;
  className?: string;
}

export function OnlineIndicator({ isOnline, showText = false, lastSeen, className }: OnlineIndicatorProps) {
  if (showText) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-green-400' : 'bg-gray-500'
          )}
        />
        <span className={cn('text-xs', isOnline ? 'text-green-400' : 'text-gray-500')}>
          {isOnline ? 'Active now' : (lastSeen ? lastSeen : 'Offline')}
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'w-2.5 h-2.5 rounded-full ring-2 ring-[#111827]',
        isOnline ? 'bg-green-400' : 'bg-gray-500',
        className
      )}
      aria-label={isOnline ? 'Online' : 'Offline'}
    />
  );
}
