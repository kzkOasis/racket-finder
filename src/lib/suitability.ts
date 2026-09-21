import type { Axis, AxisScores, RacketSpec } from './types';
import { AXES } from './types';

/** 6軸スコアから「こんな人に向いている」「注意点」を組み立てる（個別ページ用）。 */

const STRENGTH_PHRASES: Record<Axis, string> = {
  power: '自分から強く振らなくてもボールが飛びます。ラリーで球が失速しやすい人、スイングが小さめの人に向いています',
  control: '狙ったところに収まりやすいラケットです。自分でスピードを出せる人、アウトが多い人に向いています',
  spin: 'スピンがかけやすいラケットです。厚い当たりで振り抜く人、高く弾ませて沈めたい人に向いています',
  maneuverability: '振り抜きが軽く、速い展開でも振り遅れにくいラケットです。ダブルスや前衛の機会が多い人に向いています',
  comfort: '打球時の衝撃が少なめです。腕への負担を減らしたい人が候補にしやすいラケットです',
  volley: 'ネット前での操作がしやすいラケットです。ボレーやスマッシュの機会が多い人に向いています',
};

const CAUTION_PHRASES: Record<Axis, string> = {
  power: '自分でスイングスピードを出せないと、ボールを飛ばしにくく感じることがあります',
  control: 'よく飛ぶぶん、深さのコントロールは自分で合わせる必要があります',
  spin: 'スピンは自然にはかかりにくいので、回転をかける打ち方が前提になります',
  maneuverability: '取り回しは重めです。速い展開では振り遅れやすくなります',
  comfort: 'フレームは硬めで打球感が強く出ます。腕に不安がある場合は注意してください',
  volley: 'ネット前での細かい操作は得意な方ではありません',
};

const HIGH = 62;
const LOW = 38;

function rank(scores: AxisScores): Axis[] {
  return (AXES as readonly Axis[]).slice().sort((a, b) => scores[b] - scores[a]);
}

/**
 * 向いている人。スコアが高い軸から最大2つ。
 * 閾値に届く軸が無い場合でも、いちばん高い軸で1つは返す（空にしない）。
 */
export function describeStrengths(scores: AxisScores): string[] {
  const sorted = rank(scores);
  const high = sorted.filter(a => scores[a] >= HIGH).slice(0, 2);
  const picked = high.length > 0 ? high : sorted.slice(0, 1);
  return picked.map(a => STRENGTH_PHRASES[a]);
}

/** 注意点。いちばん低い軸が閾値を下回るときだけ返す。 */
export function describeCautions(scores: AxisScores): string[] {
  const sorted = rank(scores);
  const lowest = sorted[sorted.length - 1];
  return scores[lowest] <= LOW ? [CAUTION_PHRASES[lowest]] : [];
}

/** 検索結果やメタデータに出す一行スペック。 */
export function specSummary(racket: RacketSpec): string {
  return `重さ${racket.weight}g / フェイス${racket.headSize}平方インチ / ストリングパターン${racket.pattern} / フレーム厚${racket.beamWidth}mm`;
}
