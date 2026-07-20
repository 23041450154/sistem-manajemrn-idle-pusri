import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manajemen Idle Equipment - PT Pusri ",
  description: "Platform terpusat untuk memonitor, mengelola, dan mengoptimalkan penggunaan peralatan yang sedang tidak beroperasi di PT PUSRI.",
  icons: {
    icon: '/pusri-2.png',
  },
};

import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader color="#0556B3" height={4} showSpinner={false} shadow="0 0 10px #0556B3,0 0 5px #0556B3" />
        {children}
      </body>
    </html>
  );
}
