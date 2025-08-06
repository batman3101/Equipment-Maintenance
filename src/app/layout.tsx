import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";

// 영어와 베트남어용 Inter 폰트
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

// 한국어용 Noto Sans KR 폰트
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: "CNC 설비 관리 시스템",
  description: "CNC 현장의 설비 고장을 실시간으로 등록하고 관리하는 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="ko" 
      className={`${inter.variable} ${notoSansKR.variable}`}
      suppressHydrationWarning={true}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('cnc-theme') || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.style.colorScheme = theme;
                  // FOUC 방지를 위한 기본 스타일만 적용
                  document.documentElement.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                  document.documentElement.style.backgroundColor = '#ffffff';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-korean bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>
            <SystemSettingsProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </SystemSettingsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
