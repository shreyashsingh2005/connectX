import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Need to check if tooltip exists

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
  variant?: 'default' | 'ghost' | 'active' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const variantStyles = {
  default: 'bg-gray-100 dark:bg-[rgba(255,255,255,0.04)] text-text-sec hover:bg-gray-200 dark:hover:bg-[#374151]',
  ghost: 'bg-transparent text-text-muted hover:text-text-main dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1F2937]',
  active: 'bg-brand text-white shadow-md shadow-[#8B5CF6]/20',
  destructive: 'bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10',
};

const sizeStyles = {
  sm: 'w-8 h-8 p-1.5',
  md: 'w-10 h-10 p-2',
  lg: 'w-12 h-12 p-2.5',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', icon: Icon, tooltip, disabled, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-[12px] transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] disabled:opacity-50 disabled:pointer-events-none active:scale-95',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <Icon className={iconSizes[size]} strokeWidth={variant === 'active' ? 2.5 : 2} />
      </button>
    );

    if (!tooltip) return button;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top" align="center" sideOffset={8}>
            <p className="text-[11px] font-medium">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

IconButton.displayName = 'IconButton';

