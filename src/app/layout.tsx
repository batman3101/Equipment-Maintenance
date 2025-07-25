'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@/components/Analytics';
import { AuthProvider } from '@/domains/auth/hooks/use-auth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RouteGuard } from '@/domains/user-management/components/RouteGuard';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <title>CNC 설비 유지보수 앱</title>
        <meta name="description" content="현장 엔지니어를 위한 CNC 설비 고장 관리 웹앱" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 서비스 워커 비활성화
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
              
              // 다크모드 초기화 스크립트 (flash 방지)
              try {
                var theme = localStorage.getItem('cnc-theme');
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="cnc-theme">
          <AuthProvider>
            <RouteGuard>
              {children}
            </RouteGuard>
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}