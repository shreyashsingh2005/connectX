'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore, ThemePreferences, ThemeId, BackgroundId, AccentColor } from '@/store/useThemeStore';
import { useTheme } from 'next-themes';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ChatThemePickerProps {
  conversationId?: string | null;
  onClose: () => void;
}


const themeColors: Record<ThemeId, { light: string, dark: string }> = {
  'connect-purple': { light: '#FBFBFD', dark: '#0B0D12' },
  'midnight': { light: '#F0F4F8', dark: '#0A101D' },
  'ocean': { light: '#F0F9FF', dark: '#081729' },
  'minimal': { light: '#FFFFFF', dark: '#000000' },
  'amoled': { light: '#FFFFFF', dark: '#000000' },
  'lavender': { light: '#F5F3FF', dark: '#120F1D' },
  'mint': { light: '#ECFDF5', dark: '#061E16' },
  'sunset': { light: '#FFF7ED', dark: '#1E120A' },
  'rose': { light: '#FFF1F2', dark: '#1E0C10' },
  'aurora': { light: '#F0FDF4', dark: '#0A1A12' },
  'graphite': { light: '#F8FAFC', dark: '#0F172A' },
  'soft-sky': { light: '#F0F9FF', dark: '#0B1521' }
};

export function ChatThemePicker({ conversationId, onClose }: ChatThemePickerProps) {
  const { globalTheme, chatOverrides, setGlobalTheme, setChatOverride } = useThemeStore();
  const { profile } = useAuthStore();
  const { resolvedTheme } = useTheme();

  // Local state for the picker, initialized from the current effective theme
  const initialTheme = conversationId && chatOverrides[conversationId] 
    ? chatOverrides[conversationId] 
    : globalTheme;

  const [previewTheme, setPreviewTheme] = useState<ThemePreferences>(initialTheme);
  const isGlobal = !conversationId;

  const handleApply = () => {
    if (isGlobal) {
      setGlobalTheme(previewTheme, profile?.id);
      toast.success('Global theme updated');
    } else {
      setChatOverride(conversationId, previewTheme, profile?.id);
      toast.success('Chat theme updated');
    }
    onClose();
  };

  const handleReset = () => {
    if (!isGlobal) {
      setChatOverride(conversationId, null, profile?.id);
      toast.success('Chat theme reset to global');
      onClose();
    }
  };

  const updatePreview = (updates: Partial<ThemePreferences>) => {
    setPreviewTheme(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
      <div className="bg-bg-surface w-full max-w-[440px] rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle border-border-subtle flex-shrink-0">
          <div>
            <h2 className="text-[14px] font-semibold text-text-main">Chat Theme</h2>
            <p className="text-[11px] text-text-muted">Personalize how your conversations look.</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main dark:hover:text-white transition-colors p-2 -mr-2">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          <div className="rounded-[16px] overflow-hidden border border-border-subtle border-border-subtle h-[180px] relative flex flex-col justify-end p-4 shadow-inner"
            style={{
              backgroundColor: resolvedTheme === 'dark' ? (themeColors[previewTheme.themeId]?.dark || '#0B0D12') : (themeColors[previewTheme.themeId]?.light || '#FBFBFD')
            }}
          >
            {previewTheme.backgroundId !== 'solid' && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-30" 
                style={{ 
                  WebkitMaskImage: `url('/patterns/${previewTheme.backgroundId}.svg')`, maskImage: `url('/patterns/${previewTheme.backgroundId}.svg')`, WebkitMaskSize: '100px 100px', maskSize: '100px 100px', backgroundColor: resolvedTheme === 'dark' ? 'white' : 'black',
                  color: resolvedTheme === 'dark' ? 'white' : 'black'
                }} 
              />
            )}
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[rgba(255,255,255,0.08)] flex-shrink-0 shadow-sm" />
                <div className="max-w-[75%] px-3 py-2 text-[13px] rounded-[14px] rounded-bl-[4px] bg-[#FFFFFF] dark:bg-[#171B23] text-text-main shadow-sm">
                  Hey! Have you seen the new theme?
                </div>
              </div>
              <div className="flex items-end justify-end gap-2">
                <div className="max-w-[75%] px-3 py-2 text-[13px] rounded-[14px] rounded-br-[4px] text-white shadow-sm"
                  style={{ backgroundColor: previewTheme.accentColor === 'purple' ? '#8B5CF6' : previewTheme.accentColor === 'blue' ? '#3B82F6' : previewTheme.accentColor === 'pink' ? '#EC4899' : previewTheme.accentColor === 'green' ? '#10B981' : '#F97316' }}
                >
                  Yeah, it looks absolutely stunning!
                </div>
              </div>
            </div>
          </div>

          
          <div>
            <p className="text-[12px] font-semibold text-text-sec uppercase tracking-wider mb-3">Base Theme</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[
                { id: 'connect-purple', name: 'Default' },
                { id: 'midnight', name: 'Midnight' },
                { id: 'ocean', name: 'Ocean' },
                { id: 'lavender', name: 'Lavender' }
              ].map(theme => (
                <button key={theme.id} onClick={() => updatePreview({ themeId: theme.id as ThemeId })}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-2 rounded-[12px] border transition-all", 
                    previewTheme.themeId === theme.id 
                      ? "border-[#8B5CF6] bg-brand/5 shadow-sm" 
                      : "border-border-subtle border-border-subtle hover:bg-bg-secondary"
                  )}
                >
                  <div className="w-full h-8 rounded-[8px] mb-2 border border-border-subtle" 
                    style={{ backgroundColor: resolvedTheme === 'dark' ? themeColors[theme.id as ThemeId]?.dark : themeColors[theme.id as ThemeId]?.light }} 
                  />
                  <span className={cn("text-[11px] font-medium", previewTheme.themeId === theme.id ? "text-brand" : "text-text-main")}>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-text-sec uppercase tracking-wider mb-3">Accent Color</p>
            <div className="flex gap-4">
              {['purple', 'blue', 'pink', 'green', 'orange'].map(c => (
                <button key={c} onClick={() => updatePreview({ accentColor: c as AccentColor })}
                  className={cn("w-10 h-10 rounded-full border-2 transition-transform flex items-center justify-center", previewTheme.accentColor === c ? "border-[#101828] dark:border-white scale-110 shadow-md" : "border-transparent hover:scale-105")}
                  style={{ backgroundColor: c === 'purple' ? '#8B5CF6' : c === 'blue' ? '#3B82F6' : c === 'pink' ? '#EC4899' : c === 'green' ? '#10B981' : '#F97316' }}
                >
                  {previewTheme.accentColor === c && <Check size={18} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-[12px] font-semibold text-text-sec uppercase tracking-wider mb-3">Chat Background</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'solid', name: 'Solid' },
                { id: 'dots', name: 'Soft Dots' },
                { id: 'circles', name: 'Circles' },
                { id: 'waves', name: 'Waves' },
                { id: 'grid', name: 'Minimal Grid' },
                { id: 'aurora-lines', name: 'Aurora' }
              ].map(bg => (
                <button key={bg.id} onClick={() => updatePreview({ backgroundId: bg.id as BackgroundId })}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 px-2 rounded-[12px] border transition-all", 
                    previewTheme.backgroundId === bg.id 
                      ? "border-[#8B5CF6] bg-brand/5 shadow-sm" 
                      : "border-border-subtle border-border-subtle hover:bg-bg-secondary"
                  )}
                >
                  <span className={cn("text-[12px] font-medium", previewTheme.backgroundId === bg.id ? "text-brand" : "text-text-main")}>{bg.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-subtle border-border-subtle bg-bg-secondary flex gap-3 flex-shrink-0 safe-area-inset-bottom">
          {!isGlobal && chatOverrides[conversationId] && (
            <button onClick={handleReset} className="px-4 py-2.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[10px] transition-colors">
              Reset
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 text-[13px] font-medium text-text-sec hover:bg-gray-200 dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[10px] transition-colors">
            Cancel
          </button>
          <button onClick={handleApply} className="px-6 py-2.5 text-[13px] font-medium text-white bg-brand hover:bg-brand-dark rounded-[10px] transition-colors shadow-sm">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
