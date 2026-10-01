import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-gray-200 dark:bg-[#151922]',
        className
      )}
    />
  );
}

export function ConversationItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={cn('flex gap-2.5 mb-4', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
      <div className={cn('space-y-1', isOwn ? 'items-end' : 'items-start', 'flex flex-col')}>
        <Skeleton className={cn('h-10 rounded-2xl', isOwn ? 'w-48' : 'w-64')} />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function ProfilePanelSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
