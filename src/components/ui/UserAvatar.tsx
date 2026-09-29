import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-[28px] h-[28px]', text: 'text-[11px]', indicator: 'w-2 h-2' },
  md: { container: 'w-[32px] h-[32px]', text: 'text-xs', indicator: 'w-2 h-2' },
  lg: { container: 'w-[36px] h-[36px]', text: 'text-sm', indicator: 'w-2.5 h-2.5' },
  xl: { container: 'w-[48px] h-[48px]', text: 'text-base', indicator: 'w-3 h-3' },
  '2xl': { container: 'w-[72px] h-[72px]', text: 'text-xl', indicator: 'w-4 h-4' },
};

export function UserAvatar({ src, name, size = 'md', isOnline, className }: UserAvatarProps) {
  const sizes = sizeMap[size];
  const initials = getInitials(name);

  return (
    <div className={cn('relative flex-shrink-0', sizes.container, className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="rounded-full object-cover shadow-sm"
          sizes="100%"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center font-medium text-[#101828] dark:text-[#F5F7FA] bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34]',
            sizes.text
          )}
          aria-label={`Avatar for ${name}`}
        >
          {initials}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-[#0B0D12]',
            sizes.indicator,
            isOnline ? 'bg-[#12B76A]' : 'bg-[#98A2B3]'
          )}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
