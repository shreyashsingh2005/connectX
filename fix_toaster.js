const fs = require('fs');

let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');

layout = layout.replace(/<Toaster[\s\S]*?\/>/, `<Toaster
            position="top-center"
            toastOptions={{
              className: 'text-[13px] font-medium shadow-md',
              duration: 3000,
              style: {
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-main)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '12px',
                maxWidth: '360px',
                padding: '10px 14px',
              },
              success: {
                iconTheme: {
                  primary: '#8B5CF6',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#F04438',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />`);

fs.writeFileSync('src/app/layout.tsx', layout);
console.log('Updated Toaster in layout.tsx');
