import type { Metadata, Viewport } from 'next';

import { APP_DESCRIPTION, APP_NAME } from '@/lib/constants';
import { AuthProvider } from '@/domains/auth/hooks/use-auth';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ['CNC', '설비', '고장', '관리', '유지보수', 'maintenance'],
  authors: [{ name: 'CNC Maintenance Team' }],
  creator: 'CNC Maintenance Team',
  publisher: 'CNC Maintenance Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-background min-h-screen font-sans antialiased">
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
