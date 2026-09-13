'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
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

export function AxisRadarChart({ ideal, rackets }: Props) {
  const data = Object.keys(AXIS_LABELS).map((key) => ({
    axis: AXIS_LABELS[key as keyof typeof AXIS_LABELS],
    ideal: Math.round(ideal[key as keyof AxisScores]),
    ...Object.fromEntries(
      rackets.map((r) => [r.name, Math.round(r.scores[key as keyof AxisScores])])
    ),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
        <Radar
          name="あなたの理想"
          dataKey="ideal"
          stroke="#6366f1"
          fill="#6366f1"
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
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
