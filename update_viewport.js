const fs = require('fs');
let file = fs.readFileSync('src/app/layout.tsx', 'utf8');

file = file.replace(
`export const metadata: Metadata = {`,
`import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {`
);

fs.writeFileSync('src/app/layout.tsx', file);
