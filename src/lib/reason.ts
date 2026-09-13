import type { Axis, AxisScores, Target } from './types';
import { AXES } from './types';

const AXIS_LABELS: Record<Axis, string> = {
  power: 'パワー',
  control: 'コントロール',
  spin: 'スピン',
  maneuverability: '操作性',
  comfort: '快適性',
  volley: 'ボレー',
};

const HIGH_SCORE_PHRASES: Record<Axis, string> = {
  power: 'ボールが飛びやすく',
  control: 'コントロールしやすく',
  spin: 'スピンがかかりやすく',
  maneuverability: '振り抜きが軽く',
  comfort: 'フレームが柔らかく衝撃が少なく',
  volley: 'ボレーがしやすく',
};

const SECONDARY_BENEFIT_PHRASES: Record<Axis, string> = {
  power: 'パワーアシストも期待できます',
  control: 'コントロールの向上にもつながります',
  spin: 'スピンのかかりの向上にもつながります',
  maneuverability: '振り遅れの解消にもつながります',
  comfort: '腕への負担も軽減できます',
  volley: 'ボレーの安定感も増します',
};

export function generateReason(
  modelName: string,
  axisScores: AxisScores,
  target: Target,
): string {
  // 正規化後の weight が大きい軸を上位2つ取る
  const sorted = (AXES as readonly Axis[])
    .slice()
    .sort((a, b) => target.weight[b] - target.weight[a]);

  const axis1 = sorted[0];
  const axis2 = sorted[1];

  const phrase1 = HIGH_SCORE_PHRASES[axis1];
  const benefit2 = SECONDARY_BENEFIT_PHRASES[axis2];

  return `${AXIS_LABELS[axis1]}を重視している方に向けて、${phrase1}${modelName}を選びました。${AXIS_LABELS[axis2]}面でも優れているため、${benefit2}。`;
}
