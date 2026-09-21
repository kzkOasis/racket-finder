import type { Axis, AxisScores, Target } from './types';
import { AXES } from './types';

/**
 * 結果カードの理由文。
 *
 * ユーザー側の重みだけでなく、そのラケット自身のスコアも見る。
 * スコアが低い軸を「優れている」と書かないための下限が STRONG。
 */

const AXIS_LABELS: Record<Axis, string> = {
  power: 'パワー',
  control: 'コントロール',
  spin: 'スピン',
  maneuverability: '操作性',
  comfort: '快適性',
  volley: 'ボレー',
};

/** 「〜一本です」の前に置く、その軸が強いラケットの特徴。 */
const STRENGTH_PREDICATE: Record<Axis, string> = {
  power: 'ボールが飛びやすい',
  control: '狙ったところに収まりやすい',
  spin: 'スピンがかかりやすい',
  maneuverability: '振り抜きが軽い',
  comfort: 'フレームが柔らかく、打球の衝撃が少ない',
  volley: 'ネット前で操作しやすい',
};

/** 2番目に強い軸の補足。 */
const SECONDARY_CLAUSE: Record<Axis, string> = {
  power: 'パワーにも余裕があります',
  control: 'コントロール面でも安定します',
  spin: 'スピンもかけやすくなっています',
  maneuverability: '取り回しも軽めです',
  comfort: '腕への負担も抑えられます',
  volley: 'ボレーでも扱いやすくなっています',
};

/** この値以上のときだけ「その軸が強い」と書いてよい（0〜100の相対評価）。 */
export const STRONG = 60;

/** 「重視するあなたに」と書いてよいのは、重みが上位この数までの軸。 */
const PRIORITY_COUNT = 3;

export type ReasonAxes = {
  /** 文の主役にする軸 */
  main: Axis;
  /** 補足に使う軸。該当が無ければ null */
  sub: Axis | null;
  /** main がユーザーの重視する軸と一致しているか */
  matchesPriority: boolean;
};

function byWeight(target: Target): Axis[] {
  return (AXES as readonly Axis[]).slice().sort((a, b) => target.weight[b] - target.weight[a]);
}

function byScore(scores: AxisScores): Axis[] {
  return (AXES as readonly Axis[]).slice().sort((a, b) => scores[b] - scores[a]);
}

/**
 * 理由文に使う軸を選ぶ。
 *
 * 1. ユーザーが重視する軸のうち、このラケットが実際に強い（STRONG以上）もの
 * 2. 無ければ、このラケット自身のいちばん高い軸
 *
 * `used` に入っている軸は、他に候補があるかぎり避ける（3本で同じ文にしないため）。
 */
export function selectReasonAxes(
  axisScores: AxisScores,
  target: Target,
  used: ReadonlySet<Axis> = new Set(),
): ReasonAxes {
  const weighted = byWeight(target);
  const strongByWeight = weighted.filter(a => axisScores[a] >= STRONG);
  const unusedStrong = strongByWeight.filter(a => !used.has(a));

  let main: Axis;
  if (unusedStrong.length > 0) {
    main = unusedStrong[0];
  } else if (strongByWeight.length > 0) {
    main = strongByWeight[0];
  } else {
    // 重視する軸では強みがない。ラケット自身の持ち味で説明する
    const ranked = byScore(axisScores);
    main = ranked.find(a => !used.has(a)) ?? ranked[0];
  }

  // 「重視するあなたに」と書けるのは、重みが上位の軸で、かつ実際に強いときだけ
  const matchesPriority =
    weighted.slice(0, PRIORITY_COUNT).includes(main) && axisScores[main] >= STRONG;

  // 補足は、main 以外で STRONG 以上のうち重みが大きいもの
  const sub = byWeight(target).find(a => a !== main && axisScores[a] >= STRONG) ?? null;

  return { main, sub, matchesPriority };
}

function compose(modelName: string, axes: ReasonAxes): string {
  const head = axes.matchesPriority
    ? `${AXIS_LABELS[axes.main]}を重視するあなたに。${modelName}は${STRENGTH_PREDICATE[axes.main]}一本です。`
    : `${modelName}は${STRENGTH_PREDICATE[axes.main]}タイプの一本です。`;
  return axes.sub ? `${head}${SECONDARY_CLAUSE[axes.sub]}。` : head;
}

/** 1本ぶんの理由文。 */
export function generateReason(
  modelName: string,
  axisScores: AxisScores,
  target: Target,
  used: ReadonlySet<Axis> = new Set(),
): string {
  return compose(modelName, selectReasonAxes(axisScores, target, used));
}

/**
 * 3本ぶんをまとめて作る。
 * 先に使った軸は避けるので、同じ文が並びにくくなる。
 */
export function generateReasons(
  items: ReadonlyArray<{ racket: { model: string }; axisScores: AxisScores }>,
  target: Target,
): string[] {
  const used = new Set<Axis>();
  return items.map(item => {
    const axes = selectReasonAxes(item.axisScores, target, used);
    used.add(axes.main);
    return compose(item.racket.model, axes);
  });
}
