'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn, getInitials } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { container: 'w-[28px] h-[28px]', text: 'text-[10px]', indicator: 'w-[10px] h-[10px]' },
  sm: { container: 'w-[32px] h-[32px]', text: 'text-[11px]', indicator: 'w-[10px] h-[10px]' },
  md: { container: 'w-[40px] h-[40px]', text: 'text-[13px]', indicator: 'w-[12px] h-[12px] border-[2px]' },
  lg: { container: 'w-[48px] h-[48px]', text: 'text-[15px]', indicator: 'w-[14px] h-[14px] border-[2.5px]' },
  xl: { container: 'w-[64px] h-[64px]', text: 'text-[20px]', indicator: 'w-[16px] h-[16px] border-[3px]' },
  '2xl': { container: 'w-[80px] h-[80px]', text: 'text-[24px]', indicator: 'w-[18px] h-[18px] border-[3px]' },
};

export function UserAvatar({ src, name, size = 'md', isOnline, className }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgError(false);
  }
  const sizes = sizeMap[size] || sizeMap.md;
  const initials = getInitials(name);

  return (
    <div className={cn('relative flex-shrink-0', sizes.container, className)}>
      {src && !imgError ? (
        <Image
          src={src}
          alt={name}
          fill
          className="rounded-full object-cover shadow-sm"
          onError={() => setImgError(true)}
          sizes="100%"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center font-[600] bg-brand-soft dark:bg-brand/10 text-brand border border-brand/10',
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
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-bg-surface z-10',
            sizes.indicator,
            isOnline ? 'bg-[#12B76A]' : 'bg-[#9A9FAD]'
          )}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
