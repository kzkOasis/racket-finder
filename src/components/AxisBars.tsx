import type { Axis, AxisScores } from '@/lib/types';
import { AXES } from '@/lib/types';

const AXIS_LABELS: Record<Axis, string> = {
  power: 'パワー',
  control: 'コントロール',
  spin: 'スピン',
  maneuverability: '操作性',
  comfort: '快適性',
  volley: 'ボレー',
};

/**
 * 6軸スコアを横棒で表示する。個別ページ用。
 * レーダーチャートと違い JavaScript を使わないので、検索エンジンにも読める。
 */
export function AxisBars({ scores }: { scores: AxisScores }) {
  return (
    <dl className="flex flex-col gap-3">
      {(AXES as readonly Axis[]).map(axis => {
        const value = Math.round(scores[axis]);
        return (
          <div key={axis} className="flex items-center gap-3">
            <dt className="w-24 shrink-0 text-sm text-gray-600">{AXIS_LABELS[axis]}</dt>
            <dd className="flex flex-1 items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-sm tabular-nums text-gray-700">
                {value}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
