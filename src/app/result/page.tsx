import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResultPageContent from './ResultPageContent';
import { decodeAnswers } from '@/lib/share';
import { buildTarget } from '@/lib/target';
import { runDiagnosis } from '@/lib/score';
import type { RacketSpec } from '@/lib/types';
import racketData from '@/data/rackets.json';

export async function generateMetadata(
  props: PageProps<'/result'>,
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const encoded = typeof searchParams?.a === 'string' ? searchParams.a : '';

  const fallback: Metadata = {
    title: '診断結果 | テニスラケット診断',
    description: 'あなたのプレースタイルに合ったテニスラケットの診断結果です。',
    openGraph: {
      title: '診断結果 | テニスラケット診断',
      description: 'あなたのプレースタイルに合ったテニスラケットの診断結果です。',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: '診断結果 | テニスラケット診断',
      description: 'あなたのプレースタイルに合ったテニスラケットの診断結果です。',
    },
  };

  if (!encoded) return fallback;

  const answers = decodeAnswers(encoded);
  if (!answers) return fallback;

  const target = buildTarget(answers);
  const result = runDiagnosis(racketData as RacketSpec[], target);

  if (result.noCandidates || result.top.length === 0) return fallback;

  const best = result.top[0].racket;
  const title = `${best.model} がおすすめ | テニスラケット診断`;
  const description = `診断結果: ${best.brand} ${best.model} があなたのプレースタイルに最もマッチしました。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">読み込み中...</p></div>}>
      <ResultPageContent />
    </Suspense>
  );
}
