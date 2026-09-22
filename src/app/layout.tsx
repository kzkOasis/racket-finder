import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: 'テニスラケット診断 | あなたに合ったラケットを見つけよう',
  description: '9問に答えるだけで、あなたのレベルやプレースタイルに合ったテニスラケットを3本提案します。',
  verification: {
    google: 'Wt4T1dNPslXy6Qg7LDMbkCoz248E2J8ZAqLcI3MCHDg',
  },
  openGraph: {
    title: 'テニスラケット診断 | あなたに合ったラケットを見つけよう',
    description: '9問に答えるだけで、あなたのレベルやプレースタイルに合ったテニスラケットを3本提案します。',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'テニスラケット診断',
    description: '9問に答えるだけで最適なラケットを提案！',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="w-full bg-amber-50 border-b border-amber-200 text-center py-2 px-4 text-sm text-amber-800">
          本ページはアフィリエイト広告を含みます
        </div>
        {children}
        <footer className="mt-auto border-t border-gray-200 py-4 px-4 text-center text-xs text-gray-500">
          <a
            href="https://webservice.rakuten.co.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Supported by 楽天ウェブサービス
          </a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
