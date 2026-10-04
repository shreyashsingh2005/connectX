const fs = require('fs');

// --- ChatHeader.tsx ---
let header = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

// Action buttons: "radius: 9px" instead of "rounded-full"
header = header.replace(/className="w-\[36px\] h-\[36px\] rounded-full flex items-center justify-center text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-bg-secondary transition-colors"/g, 'className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-bg-secondary transition-colors"');
header = header.replace(/className="w-\[36px\] h-\[36px\] rounded-full flex items-center justify-center text-text-sec hover:bg-bg-secondary dark:hover:bg-bg-secondary hover:text-text-main dark:hover:text-text-main transition-colors outline-none"/g, 'className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center text-text-sec hover:bg-bg-secondary dark:hover:bg-bg-secondary hover:text-text-main dark:hover:text-text-main transition-colors outline-none"');

fs.writeFileSync('src/components/chat/ChatHeader.tsx', header);
console.log('Processed ChatHeader.tsx');

// --- MessageBubble.tsx ---
let bubble = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// "Reactions: pill 24-28px height, radius 999px, font 11-12px."
bubble = bubble.replace(/className="flex items-center gap-1 px-2 py-0\.5 rounded-md bg-bg-surface border-border-subtle border-border-subtle hover:bg-bg-secondary transition-colors text-\[10px\] font-medium shadow-sm text-text-sec"/g, 'className="flex items-center gap-1 px-2.5 h-[26px] rounded-full bg-bg-surface border border-border-subtle hover:bg-bg-secondary transition-colors text-[11px] font-medium shadow-sm text-text-sec"');

// Hover Actions
bubble = bubble.replace(/w-7 h-7 rounded-\[8px\]/g, 'w-8 h-8 rounded-[8px]');
bubble = bubble.replace(/w-6 h-6 rounded-md/g, 'w-8 h-8 rounded-[8px]');
bubble = bubble.replace(/w-3\.5 h-3\.5/g, 'w-4 h-4');
bubble = bubble.replace(/px-0\.5/g, 'px-1'); // slight padding for hover toolbar

// Bubble padding and font: "Padding: 8px 11px, Message font: 14px line-height: 20px"
bubble = bubble.replace(/px-\[12px\] py-\[8px\]/g, 'px-[11px] py-[8px]');
bubble = bubble.replace(/text-\[14px\] leading-\[1\.4\]/g, 'text-[14px] leading-[20px]');

// Max width: "70-76%, Mobile 80-84%"
bubble = bubble.replace(/max-w-\[80%\] md:max-w-\[70%\]/g, 'max-w-[82%] md:max-w-[74%]');

// Large Emoji messages: "32-40px"
bubble = bubble.replace(/text-\[44px\]/g, 'text-[36px]');

// Incoming Bubble Colors: "Light: background #FFFFFF border #ECEAF1. Dark: #171A21"
// Outgoing Bubble Colors: "soft connectX purple." (The theme logic is handled by ChatThemePicker setting CSS variables, so the CSS vars bg-[var(--chat-incoming-bg)] are still correct to keep. However, we ensure no border on outgoing)
// Wait, the spec says "Incoming: border: 1px solid #ECEAF1 (light), Dark: #171A21". Currently incoming uses `border border-[var(--chat-incoming-border)]`.
// We should check globals.css to see what `--chat-incoming-border` is. We'll leave the CSS variable classes intact to satisfy "Use existing working theme".

fs.writeFileSync('src/components/chat/MessageBubble.tsx', bubble);
console.log('Processed MessageBubble.tsx');

// --- MessageComposer.tsx ---
let composer = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// "Composer Background: light #FFFFFF, dark #171A21"
composer = composer.replace(/bg-bg-surface\/80 dark:bg-bg-surface\/80 backdrop-blur-\[18px\]/g, 'bg-[#FFFFFF] dark:bg-[#171A21]');

// Send button 36-40px
composer = composer.replace(/w-\[40px\] h-\[40px\] flex-shrink-0 flex items-center justify-center/g, 'w-[36px] h-[36px] md:w-[40px] md:h-[40px] flex-shrink-0 flex items-center justify-center');
composer = composer.replace(/w-\[34px\] h-\[34px\]/g, 'w-[36px] h-[36px]');

fs.writeFileSync('src/components/chat/MessageComposer.tsx', composer);
console.log('Processed MessageComposer.tsx');
