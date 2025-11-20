import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "软件成本评估看板",
  description: "专业的软件项目成本测算和工期评估系统",
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
  },
};

// 移动端显示PC端布局：设置固定宽度并允许缩放
export const viewport: Viewport = {
  width: 1440,
  initialScale: 1,
  minimumScale: 0.1,
  maximumScale: 3,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
