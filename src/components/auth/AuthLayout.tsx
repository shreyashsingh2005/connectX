'use client';

import React, { useEffect, useRef } from 'react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  // Use a plain object assigned to React.CSSProperties to avoid inline cast issues with Turbopack
  const panelStyle = { '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-bg-surface overflow-x-hidden md:overflow-hidden">
      
      {/* Mobile Top Brand Section */}
      <div className="md:hidden flex flex-col items-center justify-center py-8 px-5 bg-[#080A10] text-white relative overflow-hidden">
        {/* Subtle mobile glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(139,92,246,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="w-[42px] h-[42px] bg-brand text-white rounded-[12px] flex items-center justify-center mb-4 shadow-[0_8px_16px_rgba(139,92,246,0.2)] animate-auth-fade">
          <ConnectXLogo size={24} />
        </div>
        <h1 className="text-[24px] font-[700] tracking-tight mb-1.5 animate-auth-fade" style={{ animationDelay: '80ms' }}>connectX</h1>
        <p className="text-[14px] text-[#A7ADBA] text-center font-medium animate-auth-fade" style={{ animationDelay: '150ms' }}>A private, simple and secure way to stay connected.</p>
      </div>

      {/* Desktop Left Brand Panel */}
      <div 
        ref={panelRef}
        className="hidden md:flex w-[45%] max-w-[560px] flex-col justify-between bg-[#080A10] text-white p-14 relative overflow-hidden group"
        style={panelStyle}
      >
        {/* Animated Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand/20 blur-[100px] rounded-full pointer-events-none animate-ambient-glow" />
        
        {/* Interactive Pointer Glow */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
          style={{
            background: 'radial-gradient(circle 400px at var(--mouse-x) var(--mouse-y), rgba(139,92,246,0.08), transparent 80%)'
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-[44px] h-[44px] bg-brand text-white rounded-[12px] flex items-center justify-center shadow-[0_8px_20px_rgba(139,92,246,0.25)] animate-auth-fade" style={{ animationDelay: '0ms' }}>
              <ConnectXLogo size={26} />
            </div>
            <span className="text-[20px] font-[700] tracking-tight animate-auth-fade" style={{ animationDelay: '80ms' }}>connectX</span>
          </div>
          
          <h1 className="text-[52px] xl:text-[60px] font-[750] leading-[1.02] tracking-[-0.02em] mb-6">
            <div className="animate-auth-fade" style={{ animationDelay: '150ms' }}>Connect.</div>
            <div className="animate-auth-fade" style={{ animationDelay: '220ms' }}>Chat.</div>
            <div className="animate-auth-fade text-transparent bg-clip-text bg-gradient-to-r from-brand to-[#A78BFA]" style={{ animationDelay: '290ms' }}>Share.</div>
          </h1>
          <p className="text-[16px] xl:text-[17px] text-[#A7ADBA] max-w-[340px] leading-[1.6] font-medium animate-auth-fade" style={{ animationDelay: '350ms' }}>
            A private, simple and secure way to stay connected.
          </p>
        </div>

        {/* Premium Abstract Illustration */}
        <div className="relative z-10 w-full aspect-[4/3] max-w-[380px] mx-auto mt-12 opacity-90">
          {/* Bubble 1 */}
          <div 
            className="absolute top-[10%] left-[5%] w-[65%] h-[46px] bg-[#141721] rounded-[24px] rounded-bl-[6px] border border-[#232736] flex items-center px-5 gap-2.5 animate-auth-fade shadow-[0_4px_20px_rgba(0,0,0,0.2)]" 
            style={{ animationDelay: '400ms' }}
          >
            <div className="animate-bubble-float w-full h-full flex items-center gap-2.5" style={{ animationDelay: '0ms' }}>
              <div className="w-[28px] h-[6px] rounded-full bg-[#343A4D]" />
              <div className="w-[48px] h-[6px] rounded-full bg-[#343A4D]" />
            </div>
          </div>
          
          {/* Bubble 2 (Brand) */}
          <div 
            className="absolute top-[40%] right-[5%] w-[75%] h-[46px] bg-brand rounded-[24px] rounded-br-[6px] flex items-center px-5 gap-2.5 shadow-[0_8px_24px_rgba(139,92,246,0.3)] animate-auth-fade"
            style={{ animationDelay: '500ms' }}
          >
            <div className="animate-bubble-float w-full h-full flex justify-end items-center gap-2.5" style={{ animationDelay: '800ms' }}>
               <div className="w-[36px] h-[6px] rounded-full bg-white/40" />
               <div className="w-[72px] h-[6px] rounded-full bg-white/90" />
            </div>
          </div>
          
          {/* Bubble 3 */}
          <div 
            className="absolute top-[70%] left-[20%] w-[55%] h-[46px] bg-[#141721] rounded-[24px] rounded-bl-[6px] border border-[#232736] flex items-center px-5 gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] animate-auth-fade"
            style={{ animationDelay: '600ms' }}
          >
            <div className="animate-bubble-float w-full h-full flex items-center gap-2.5" style={{ animationDelay: '1600ms' }}>
              <div className="w-[24px] h-[6px] rounded-full bg-[#343A4D]" />
              <div className="w-[42px] h-[6px] rounded-full bg-[#343A4D]" />
            </div>
          </div>

          {/* Floating dots */}
          <div className="absolute top-[15%] right-[20%] w-[8px] h-[8px] rounded-full bg-brand/50 animate-auth-fade" style={{ animationDelay: '700ms' }}>
            <div className="animate-bubble-float w-full h-full bg-brand rounded-full" style={{ animationDelay: '400ms' }} />
          </div>
          <div className="absolute bottom-[20%] left-[10%] w-[6px] h-[6px] rounded-full bg-brand/40 animate-auth-fade" style={{ animationDelay: '800ms' }}>
            <div className="animate-bubble-float w-full h-full bg-brand rounded-full" style={{ animationDelay: '1200ms' }} />
          </div>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 md:p-12 bg-bg-surface relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto animate-auth-fade" style={{ animationDelay: '120ms' }}>
          {children}
        </div>
      </div>
      
    </div>
  );
}
