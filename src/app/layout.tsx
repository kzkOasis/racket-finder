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
  title: 'テニスラケット診断 | あなたに合ったラケットを見つけよう',
  description: '8問に答えるだけで、あなたのレベルやプレースタイルに合ったテニスラケットを3本提案します。',
  openGraph: {
    title: 'テニスラケット診断 | あなたに合ったラケットを見つけよう',
    description: '8問に答えるだけで、あなたのレベルやプレースタイルに合ったテニスラケットを3本提案します。',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary',
    title: 'テニスラケット診断',
    description: '8問に答えるだけで最適なラケットを提案！',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="w-full bg-amber-50 border-b border-amber-200 text-center py-2 px-4 text-sm text-amber-800">
          本ページはアフィリエイト広告を含みます
        </div>
        {children}
      </body>
    </html>
  );
}
