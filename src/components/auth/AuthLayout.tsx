'use client';

import React, { useEffect, useRef } from 'react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
import { useTheme } from 'next-themes';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    const panel = panelRef.current;
    if (!panel) return;

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        panel.style.setProperty('--mouse-x', `${x}%`);
        panel.style.setProperty('--mouse-y', `${y}%`);
      });
    };

    panel.addEventListener('mousemove', handleMouseMove);
    return () => {
      panel.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const panelStyle = { '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col min-[900px]:grid min-[900px]:grid-cols-[minmax(0,44%)_minmax(0,56%)] bg-[#F7F7FB] dark:bg-[#0B0D12] overflow-x-hidden">
      
      {/* MOBILE / TABLET TOP BRANDING (< 900px) */}
      <div className="min-[900px]:hidden flex flex-col items-center justify-center pt-[max(env(safe-area-inset-top,20px),32px)] pb-6 px-4 bg-[#080A10] text-white relative shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(139,92,246,0.12),transparent_75%)] pointer-events-none" />
        
        <div className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] bg-brand text-white rounded-[10px] flex items-center justify-center mb-3 shadow-[0_8px_16px_rgba(139,92,246,0.2)] animate-auth-stagger z-10" style={{ animationDelay: '0ms' }}>
          <ConnectXLogo size={20} />
        </div>
        
        <h1 className="text-[28px] sm:text-[34px] font-[750] leading-[1.05] tracking-tight mb-1 animate-auth-stagger z-10" style={{ animationDelay: '70ms' }}>
          Connect. Chat. <span className="text-brand">Share.</span>
        </h1>
        
        <p className="text-[13px] sm:text-[14px] text-[#9A9FAD] text-center font-medium animate-auth-stagger z-10 max-[400px]:hidden" style={{ animationDelay: '140ms' }}>
          A private, simple and secure way to stay connected.
        </p>
      </div>

      {/* DESKTOP LEFT BRAND PANEL (>= 900px) */}
      <div 
        ref={panelRef}
        className="hidden min-[900px]:flex flex-col justify-between bg-[#080A10] text-white p-10 lg:p-14 relative overflow-hidden group h-full"
        style={panelStyle}
      >
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand/20 blur-[100px] rounded-full pointer-events-none animate-auth-ambient" />
        
        <div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
          style={{ background: 'radial-gradient(circle 400px at var(--mouse-x) var(--mouse-y), rgba(139,92,246,0.08), transparent 80%)' }}
        />
        
        <div className="relative z-10 mt-[32px] lg:mt-[60px]">
          <div className="flex items-center gap-3 mb-16 lg:mb-20">
            <div className="w-[44px] h-[44px] bg-brand text-white rounded-[12px] flex items-center justify-center shadow-[0_8px_20px_rgba(139,92,246,0.25)] animate-auth-stagger" style={{ animationDelay: '0ms' }}>
              <ConnectXLogo size={24} />
            </div>
            <span className="text-[20px] font-[700] tracking-tight animate-auth-stagger" style={{ animationDelay: '70ms' }}>connectX</span>
          </div>
          
          <h1 className="text-[50px] lg:text-[56px] font-[750] leading-[0.98] tracking-[-0.02em] mb-6">
            <div className="animate-auth-stagger" style={{ animationDelay: '140ms' }}>Connect.</div>
            <div className="animate-auth-stagger" style={{ animationDelay: '210ms' }}>Chat.</div>
            <div className="animate-auth-stagger text-brand" style={{ animationDelay: '280ms' }}>Share.</div>
          </h1>
          <p className="text-[15px] lg:text-[16px] text-[#A7ADBA] max-w-[340px] leading-[1.6] font-medium animate-auth-stagger" style={{ animationDelay: '350ms' }}>
            A private, simple and secure way to stay connected.
          </p>
        </div>

        {/* Abstract Chat Bubbles */}
        <div className="relative z-10 w-full aspect-[4/3] max-w-[380px] mx-auto mt-12 opacity-90">
          <div 
            className="absolute top-[10%] left-[5%] w-[65%] h-[46px] bg-[#141721] rounded-[24px] rounded-bl-[6px] border border-[#232736] flex items-center px-5 gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] animate-auth-float" 
            style={{ animationDelay: '0ms' }}
          >
            <div className="w-[28px] h-[6px] rounded-full bg-[#343A4D]" />
            <div className="w-[48px] h-[6px] rounded-full bg-[#343A4D]" />
          </div>
          
          <div 
            className="absolute top-[40%] right-[5%] w-[75%] h-[46px] bg-brand rounded-[24px] rounded-br-[6px] flex items-center px-5 gap-2.5 shadow-[0_8px_24px_rgba(139,92,246,0.3)] animate-auth-float"
            style={{ animationDelay: '180ms' }}
          >
            <div className="w-full h-full flex justify-end items-center gap-2.5">
               <div className="w-[36px] h-[6px] rounded-full bg-white/40" />
               <div className="w-[72px] h-[6px] rounded-full bg-white/90" />
            </div>
          </div>
          
          <div 
            className="absolute top-[70%] left-[20%] w-[55%] h-[46px] bg-[#141721] rounded-[24px] rounded-bl-[6px] border border-[#232736] flex items-center px-5 gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] animate-auth-float"
            style={{ animationDelay: '360ms' }}
          >
            <div className="w-[24px] h-[6px] rounded-full bg-[#343A4D]" />
            <div className="w-[42px] h-[6px] rounded-full bg-[#343A4D]" />
          </div>

          {/* Ambient Dots */}
          <div className="absolute top-[15%] right-[20%] w-[8px] h-[8px] bg-brand rounded-full animate-auth-ambient" style={{ animationDelay: '400ms' }} />
          <div className="absolute bottom-[20%] left-[10%] w-[6px] h-[6px] bg-brand rounded-full animate-auth-ambient" style={{ animationDelay: '800ms' }} />
        </div>
      </div>

      {/* RIGHT AUTH FORM PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-5 py-6 min-[900px]:p-12 relative z-10 w-full overflow-y-auto">
        <div className="w-full max-w-[440px] mx-auto pb-[max(env(safe-area-inset-bottom,20px),24px)]">
          {mounted && children}
        </div>
      </div>
      
    </div>
  );
}
