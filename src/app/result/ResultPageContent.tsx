'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { decodeAnswers } from '@/lib/share';
import { buildTarget } from '@/lib/target';
import { runDiagnosis } from '@/lib/score';
import { generateReason } from '@/lib/reason';
import { ResultCard } from '@/components/ResultCard';
import { AxisRadarChart } from '@/components/AxisRadarChart';
import { ComparisonTable } from '@/components/ComparisonTable';
import type { RacketSpec } from '@/lib/types';
import racketData from '@/data/rackets.json';

const CHART_COLORS = ['#ef4444', '#3b82f6', '#22c55e'] as const;

export default function ResultPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encoded = searchParams.get('a') ?? '';

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

  if (result.noCandidates) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">診断結果</h1>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-gray-700 mb-4">
              ご予算内では条件に合うモデルが見つかりませんでした。
            </p>
            {result.budgetNeeded && (
              <>
                <p className="text-gray-600 text-sm mb-6">
                  ¥{result.budgetNeeded.toLocaleString()}まで広げると候補が見つかります。
                </p>
                <button
                  onClick={() => {
                    const parts = encoded.split('-');
                    parts[7] = '3'; // 予算インデックス3 = 上限なし
                    router.push(`/result?a=${parts.join('-')}`);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  予算上限なしで再診断する
                </button>
              </>
            )}
            <button
              onClick={() => router.push('/')}
              className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              診断をやり直す
            </button>
          </div>
        </div>
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
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/result?a=${encoded}`
    : `/result?a=${encoded}`;

  const ranks = [1, 2, 3] as const;

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
              reason={generateReason(item.racket.model, item.axisScores, target)}
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
