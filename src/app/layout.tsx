import type { Metadata, Viewport } from 'next';

import { APP_DESCRIPTION, APP_NAME } from '@/lib/constants';
import { AuthProvider } from '@/domains/auth/hooks/use-auth';
import { PWAProvider } from '@/components/PWAProvider';
import { PWAUpdateNotification, PWAInstallPrompt } from '@/components/PWAUpdateNotification';
import { NetworkStatus } from '@/components/NetworkStatus';
import { OfflineNotification, OfflineBanner } from '@/components/OfflineNotification';
import { SyncNotificationContainer } from '@/components/SyncNotification';
import { SyncStatusNotification } from '@/components/SyncStatusNotification';
import { ClientOnly } from '@/components/ClientOnly';

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
      <head>
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="bg-background min-h-screen font-sans antialiased">
        <AuthProvider>
          <ClientOnly 
            fallback={
              <div className="relative flex min-h-screen flex-col">
                <main className="flex-1">{children}</main>
              </div>
            }
          >
            <PWAProvider>
              <div className="relative flex min-h-screen flex-col">
                <OfflineNotification />
                <OfflineBanner />
                <main className="flex-1">{children}</main>
                <PWAUpdateNotification />
                <PWAInstallPrompt />
                <SyncNotificationContainer />
                <SyncStatusNotification />
              </div>
            </PWAProvider>
          </ClientOnly>
        </AuthProvider>
      </body>
    </html>
  );
}
