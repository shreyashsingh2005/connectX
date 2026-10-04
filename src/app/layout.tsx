import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'connectX - Connect. Chat. Share.',
  description: 'A modern real-time communication platform. Connect with friends, share moments, and collaborate in real time.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'connectX',
    description: 'Connect. Chat. Share.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-bg-surface text-text-main dark:text-gray-100 antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--toast-bg, #171E2D)',
                color: 'var(--toast-color, #F9FAFB)',
                border: '1px solid var(--toast-border, #1F2937)',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#EC4899',
                  secondary: 'var(--toast-bg, #0B0F19)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: 'var(--toast-bg, #0B0F19)',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
