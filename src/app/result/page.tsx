import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResultPageContent from './ResultPageContent';
import { getTopRacket } from '@/lib/result';
import { OG_SIZE } from '@/lib/og';

const OG_BASE = { type: 'website' as const, locale: 'ja_JP' };

function ogImage(encoded?: string) {
  return {
    url: encoded ? `/api/og?a=${encodeURIComponent(encoded)}` : '/api/og',
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    alt: 'テニスラケット診断の結果',
  };
}

export async function generateMetadata(
  props: PageProps<'/result'>,
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const encoded = typeof searchParams?.a === 'string' ? searchParams.a : '';

  const racket = getTopRacket(encoded);

  const title = racket
    ? `${racket.model} がおすすめ | テニスラケット診断`
    : '診断結果 | テニスラケット診断';
  const description = racket
    ? `診断結果: ${racket.brand} ${racket.model} があなたのプレースタイルに最もマッチしました。`
    : 'あなたのプレースタイルに合ったテニスラケットの診断結果です。';
  // 回答が不正なときはサイト共通の画像（/api/og のパラメータなし）になる
  const images = [ogImage(racket ? encoded : undefined)];

  return {
    title,
    description,
    openGraph: { ...OG_BASE, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">読み込み中...</p></div>}>
      <ResultPageContent />
    </Suspense>
  );
}
