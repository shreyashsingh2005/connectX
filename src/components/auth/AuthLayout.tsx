'use client';

import React from 'react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
import { MessageSquare } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-bg-surface overflow-x-hidden md:overflow-hidden">
      
      {/* Mobile Top Brand Section */}
      <div className="md:hidden flex flex-col items-center justify-center py-8 px-5 bg-[#0B0D14] text-white">
        <div className="w-[40px] h-[40px] bg-brand text-white rounded-[12px] flex items-center justify-center mb-3 shadow-md shadow-brand/20">
          <ConnectXLogo size={24} />
        </div>
        <h1 className="text-[22px] font-bold tracking-tight mb-1">connectX</h1>
        <p className="text-[14px] text-[#A7ADBA] text-center font-medium">A private, simple and secure way to stay connected.</p>
      </div>

      {/* Desktop Left Brand Panel */}
      <div className="hidden md:flex w-[45%] max-w-[560px] flex-col justify-between bg-[#0B0D14] text-white p-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-brand/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-[40px] h-[40px] bg-brand text-white rounded-[12px] flex items-center justify-center shadow-lg shadow-brand/20">
              <ConnectXLogo size={24} />
            </div>
            <span className="text-[20px] font-bold tracking-tight">connectX</span>
          </div>
          
          <h1 className="text-[42px] font-bold leading-[1.1] tracking-tight mb-6">
            Connect.<br />Chat.<br />Share.
          </h1>
          <p className="text-[15px] text-[#A7ADBA] max-w-[320px] leading-relaxed font-medium">
            A private, simple and secure way to stay connected.
          </p>
        </div>

        {/* Abstract Illustration */}
        <div className="relative z-10 w-full aspect-square max-w-[320px] mx-auto opacity-90 mt-8">
          <div className="absolute top-[20%] left-[10%] w-[60%] h-[40px] bg-[#1A1D27] rounded-[20px] rounded-bl-[4px] border border-[#2A2E3B] flex items-center px-4 gap-2 animate-pulse" style={{ animationDuration: '3s' }}>
            <div className="w-[24px] h-[6px] rounded-full bg-[#3A3F50]" />
            <div className="w-[48px] h-[6px] rounded-full bg-[#3A3F50]" />
          </div>
          
          <div className="absolute top-[40%] right-[10%] w-[70%] h-[40px] bg-brand rounded-[20px] rounded-br-[4px] flex items-center px-4 gap-2 shadow-lg shadow-brand/20">
             <div className="w-[32px] h-[6px] rounded-full bg-white/40" />
             <div className="w-[64px] h-[6px] rounded-full bg-white/80" />
          </div>
          
          <div className="absolute top-[65%] left-[25%] w-[50%] h-[40px] bg-[#1A1D27] rounded-[20px] rounded-bl-[4px] border border-[#2A2E3B] flex items-center px-4 gap-2">
            <div className="w-[20px] h-[6px] rounded-full bg-[#3A3F50]" />
            <div className="w-[40px] h-[6px] rounded-full bg-[#3A3F50]" />
          </div>

          {/* Floating elements */}
          <div className="absolute top-[15%] right-[25%] w-[12px] h-[12px] rounded-full bg-brand/40" />
          <div className="absolute bottom-[20%] left-[15%] w-[8px] h-[8px] rounded-full bg-brand/60" />
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 md:p-12 bg-bg-surface relative z-10 overflow-y-auto">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          {children}
        </div>
      </div>
      
    </div>
  );
}
