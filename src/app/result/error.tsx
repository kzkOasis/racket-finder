'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * 結果ページで予期しないエラーが起きたときの保険。
 * これが無いと Next.js の英語のエラー画面が出て、診断への導線が無くなる。
 */
export default function ResultError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('[result] 表示に失敗しました:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-gray-700">診断結果を表示できませんでした。</p>
      <p className="text-sm text-gray-500">
        共有されたURLが古いか、壊れている可能性があります。
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => retry()}
          className="w-full rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          もう一度読み込む
        </button>
        <Link
          href="/"
          className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600"
        >
          診断をやり直す（8問・約1分）
        </Link>
      </div>
    </div>
  );
}
