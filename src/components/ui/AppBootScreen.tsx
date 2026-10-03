'use client';

import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function AppBootScreen() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8F9FC] dark:bg-[#0B0D12] flex items-center justify-center overflow-hidden" role="status" aria-live="polite">
      {/* Background radial gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div 
          className={cn(
            "w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#4F46E5] opacity-[0.03] dark:opacity-[0.08] blur-[80px] md:blur-[120px] transition-transform duration-[10000ms] ease-linear",
            mounted ? "translate-y-[-20px] scale-105" : "translate-y-0 scale-100"
          )} 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Mark */}
        <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
          <div className="w-[48px] h-[48px] md:w-[60px] md:h-[60px] bg-white dark:bg-[#11141A] rounded-[14px] md:rounded-[16px] flex items-center justify-center shadow-sm shadow-[#8B5CF6]/10 border border-gray-100 dark:border-[#252A34]">
            <ConnectXLogo size={32} className="scale-90 md:scale-100" />
          </div>
        </div>

        {/* Brand Text */}
        <h1 className="mt-6 text-[22px] md:text-[26px] font-bold text-[#111827] dark:text-[#F5F7FA] tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '100ms' }}>
          connectX
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-[14px] md:text-[15px] text-[#6B7280] dark:text-[#98A2B3] animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: '200ms' }}>
          Secure chats. Real connections.
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex items-center gap-1.5 animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: '300ms' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] opacity-30 animate-[pulseOpacity_900ms_ease-in-out_infinite]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] opacity-30 animate-[pulseOpacity_900ms_ease-in-out_infinite]" style={{ animationDelay: '300ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] opacity-30 animate-[pulseOpacity_900ms_ease-in-out_infinite]" style={{ animationDelay: '600ms' }} />
        </div>
      </div>
    </div>
  );
}
