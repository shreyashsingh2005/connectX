import { cn } from '@/lib/utils';

interface ConnectXLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function ConnectXLogo({ size = 32, className, showText = false }: ConnectXLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="connectX logo"
      >
        <rect width="48" height="48" rx="12" fill="#8B5CF6" />
        <path
          d="M16 16L32 32M32 16L16 32"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="font-bold tracking-tight text-text-main" style={{ fontSize: size * 0.5 }}>
          connect<span className="text-brand">X</span>
        </span>
      )}
    </div>
  );
}
