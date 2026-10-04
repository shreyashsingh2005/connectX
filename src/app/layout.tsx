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
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
