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
import { InitialLoadOptimizer } from '@/components/InitialLoadOptimizer';
import { checkWebPSupport } from '@/lib/utils';

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
  // WebP 지원 여부 확인 (클라이언트 사이드에서만 실행)
  if (typeof window !== 'undefined') {
    checkWebPSupport();
  }
  
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
        
        {/* 주요 경로 프리로드 */}
        <link rel="preload" href="/_next/static/chunks/main.js" as="script" />
        <link rel="preload" href="/_next/static/chunks/app-client.js" as="script" />
        <link rel="preload" href="/fonts/font.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* DNS 프리페치 */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
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
              <InitialLoadOptimizer
                fallback={
                  <div className="flex items-center justify-center min-h-screen bg-background">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-sm text-muted-foreground">앱 로딩 중...</p>
                    </div>
                  </div>
                }
              >
                <div className="relative flex min-h-screen flex-col mobile-optimized touch-optimized">
                  <OfflineNotification />
                  <OfflineBanner />
                  <main className="flex-1">{children}</main>
                  <PWAUpdateNotification />
                  <PWAInstallPrompt />
                  <SyncNotificationContainer />
                  <SyncStatusNotification />
                </div>
              </InitialLoadOptimizer>
            </PWAProvider>
          </ClientOnly>
        </AuthProvider>
      </body>
    </html>
  );
}
