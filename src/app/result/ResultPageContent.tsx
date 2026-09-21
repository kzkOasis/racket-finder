'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useSyncExternalStore } from 'react';
import { decodeAnswers } from '@/lib/share';
import { buildTarget } from '@/lib/target';
import { runDiagnosis } from '@/lib/score';
import { generateReasons } from '@/lib/reason';
import { ResultCard } from '@/components/ResultCard';
import { AxisRadarChart } from '@/components/AxisRadarChart';
import { ComparisonTable } from '@/components/ComparisonTable';
import type { RacketSpec } from '@/lib/types';
import { SITE_URL } from '@/lib/site';
import racketData from '@/data/rackets.json';

const CHART_COLORS = ['#ef4444', '#3b82f6', '#22c55e'] as const;

const subscribeToNothing = () => () => {};

export default function ResultPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encoded = searchParams.get('a') ?? '';

  // シェアURLのオリジン。サーバー描画時は SITE_URL、クライアントでは実際のオリジンを使う
  const origin = useSyncExternalStore(
    subscribeToNothing,
    () => window.location.origin,
    () => SITE_URL,
  );

  const { result, target, answers } = useMemo(() => {
    const answers = decodeAnswers(encoded);
    if (!answers) return { result: null, target: null, answers: null };
    const target = buildTarget(answers);
    const result = runDiagnosis(racketData as RacketSpec[], target);
    return { result, target, answers };
  }, [encoded]);

  if (!answers || !target || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">回答データが見つかりません。</p>
        <button onClick={() => router.push('/')} className="text-blue-600 underline">
          診断をやり直す
        </button>
      </div>
    );
  }

  const top = result.top;
  if (top.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">条件に合うラケットが見つかりませんでした。</p>
        <button onClick={() => router.push('/')} className="text-blue-600 underline">
          診断をやり直す
        </button>
      </div>
    );
  }

  const showElbowNote = answers.q5 === 'painful';
  const shareUrl = `${origin}/result?a=${encoded}`;
  const best = top[0].racket;
  const postText = `私に合うテニスラケットは ${best.brand} ${best.model} でした🎾 #テニスラケット診断`;
  const xPostUrl =
    `https://x.com/intent/post?text=${encodeURIComponent(postText)}` +
    `&url=${encodeURIComponent(shareUrl)}`;

  const ranks = [1, 2, 3] as const;
  const reasons = generateReasons(top, target);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">あなたにおすすめのラケット</h1>
        <p className="text-gray-500 text-sm mb-8">回答をもとに最適なラケットを選びました</p>

        {/* 結果カード */}
        <div className="flex flex-col gap-4 mb-10">
          {top.map((item, i) => (
            <ResultCard
              key={item.racket.id}
              rank={ranks[i]}
              item={item}
              role={item.role}
              reason={reasons[i]}
              showElbowNote={showElbowNote && i === 0}
            />
          ))}
        </div>

        {/* レーダーチャート */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
          <h2 className="font-bold text-gray-900 mb-4">6軸チャート</h2>
          <AxisRadarChart
            ideal={target.ideal}
            rackets={top.map((item, i) => ({
              name: item.racket.model,
              scores: item.axisScores,
              color: CHART_COLORS[i],
            }))}
          />
        </div>

        {/* 比較表 */}
        {top.length > 1 && (
          <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
            <h2 className="font-bold text-gray-900 mb-4">比較表</h2>
            <ComparisonTable items={top} />
          </div>
        )}

        {/* シェアボタン */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
          <h2 className="font-bold text-gray-900 mb-3">結果をシェア</h2>
          <a
            href={xPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Xでポスト
          </a>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'テニスラケット診断結果', url: shareUrl });
              } else {
                navigator.clipboard.writeText(shareUrl);
                alert('URLをコピーしました');
              }
            }}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            この結果をシェアする
          </button>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          診断をやり直す
        </button>
      </div>
    </div>
  );
}
