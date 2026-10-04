const fs = require('fs');
let page = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

const oldCssVars = `'--chat-incoming-bg': 'var(--color-bg-surface)',
    '--chat-incoming-text': 'var(--color-text-main)',
    '--chat-incoming-muted': 'var(--color-text-muted)',
    '--chat-incoming-border': 'var(--color-border-subtle)'`;

const newCssVars = `'--chat-incoming-bg': resolvedTheme === 'dark' ? '#171A21' : '#FFFFFF',
    '--chat-incoming-text': 'var(--color-text-main)',
    '--chat-incoming-muted': 'var(--color-text-muted)',
    '--chat-incoming-border': resolvedTheme === 'dark' ? '#252936' : '#ECEAF1'`;

page = page.replace(oldCssVars, newCssVars);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', page);
console.log('Fixed Bubble Colors in page.tsx');
