'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service securely
    console.error('App-level error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-bg-primary p-4 text-center">
      <div className="w-16 h-16 rounded-[16px] bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center mb-6 shadow-sm">
        <AlertTriangle size={28} className="text-red-500" strokeWidth={1.5} />
      </div>
      <h2 className="text-[20px] font-bold text-text-main mb-2">Something went wrong</h2>
      <p className="text-[14px] text-text-sec max-w-sm mb-8 leading-relaxed">
        We encountered an unexpected error. Don't worry, your data is safe.
        {error.digest && <span className="block mt-2 text-[12px] opacity-70">Reference: {error.digest}</span>}
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-left text-[11px] overflow-auto max-h-[300px] text-red-600 dark:text-red-400 font-mono rounded">
          <p className="font-bold">{error.name}: {error.message}</p>
          <pre className="mt-2">{error.stack}</pre>
        </div>
      </p>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="bg-[#101828] dark:bg-[#F5F7FA] text-white dark:text-[#0B0D12] text-[14px] font-medium px-5 py-2.5 rounded-[8px] hover:bg-[#344054] dark:hover:bg-[#E4E7EC] transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCcw size={16} />
          Try again
        </button>
      </div>
      
      <div className="absolute bottom-8 opacity-50">
        <ConnectXLogo size={24} showText={false} />
      </div>
    </div>
  );
}
