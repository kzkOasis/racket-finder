'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import type { AxisScores } from '@/lib/types';

type Props = {
  ideal: AxisScores;
  rackets: Array<{ name: string; scores: AxisScores; color: string }>;
};

const AXIS_LABELS = {
  power: 'パワー',
  control: 'コントロール',
  spin: 'スピン',
  maneuverability: '操作性',
  comfort: '快適性',
  volley: 'ボレー',
};

const IDEAL_LABEL = 'あなたの理想';
const IDEAL_COLOR = '#6366f1';

export function AxisRadarChart({ ideal, rackets }: Props) {
  const data = Object.keys(AXIS_LABELS).map((key) => ({
    axis: AXIS_LABELS[key as keyof typeof AXIS_LABELS],
    ideal: Math.round(ideal[key as keyof AxisScores]),
    ...Object.fromEntries(
      rackets.map((r) => [r.name, Math.round(r.scores[key as keyof AxisScores])])
    ),
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        {/* outerRadius を絞って、軸ラベル（コントロール等）が切れないようにする */}
        <RadarChart data={data} outerRadius="66%">
          <PolarGrid />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <Radar
            name={IDEAL_LABEL}
            dataKey="ideal"
            stroke={IDEAL_COLOR}
            fill={IDEAL_COLOR}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          {rackets.map((r) => (
            <Radar
              key={r.name}
              name={r.name}
              dataKey={r.name}
              stroke={r.color}
              fill={r.color}
              fillOpacity={0.05}
              strokeWidth={1.5}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>

      {/* 凡例はチャートの外にHTMLで置く（recharts の Legend は軸ラベルと重なるため） */}
      <ul className="mt-1 flex flex-col gap-1 text-xs text-gray-700">
        {[...rackets.map(r => ({ name: r.name, color: r.color })),
          { name: IDEAL_LABEL, color: IDEAL_COLOR }].map(item => (
          <li key={item.name} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-4 shrink-0 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
