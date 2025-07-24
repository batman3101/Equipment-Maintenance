'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@/components/Analytics';
import { AuthProvider } from '@/domains/auth/hooks/use-auth';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <title>CNC 설비 유지보수 앱</title>
        <meta name="description" content="현장 엔지니어를 위한 CNC 설비 고장 관리 웹앱" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}