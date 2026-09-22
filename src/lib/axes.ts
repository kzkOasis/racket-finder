import type { RacketSpec, AxisScores } from './types';
import {
  PATTERN_CONTROL_BONUS, PATTERN_SPIN_BONUS, SPEC_RANGES,
  SPIN_BEST_HEAD_SIZE, SPIN_BEST_SWING_WEIGHT,
  CHARACTER_BASE, CHARACTER_WEIGHT,
} from './constants';

/** 0〜100 に丸める */
function clamp100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/**
 * スペックから6軸スコア（0〜100）を出す。
 *
 * 正規化はデータセットの最小・最大ではなく、実用レンジの固定値（SPEC_RANGES）で行う。
 * こうするとスコアが絶対的な意味を持ち、機種を足してもほかの機種のスコアが動かない。
 * レンジの外は 0 / 100 に丸める。
 */
function norm(value: number, [min, max]: readonly [number, number]): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function computeAxisScores(rackets: RacketSpec[]): Map<string, AxisScores> {
  const result = new Map<string, AxisScores>();

  for (const r of rackets) {
    const nSwingWeight = norm(r.swingWeight, SPEC_RANGES.swingWeight);
    const nHeadSize    = norm(r.headSize, SPEC_RANGES.headSize);
    const nRa          = norm(r.ra, SPEC_RANGES.ra);
    const nBeamWidth   = norm(r.beamWidth, SPEC_RANGES.beamWidth);
    const nWeight      = norm(r.weight, SPEC_RANGES.weight);
    const nBalance     = norm(r.balance, SPEC_RANGES.balance);

    const iSwingWeight = 100 - nSwingWeight;
    const iHeadSize    = 100 - nHeadSize;
    const iRa          = 100 - nRa;
    const iBeamWidth   = 100 - nBeamWidth;
    const iWeight      = 100 - nWeight;
    const iBalance     = 100 - nBalance;

    const controlBonus = PATTERN_CONTROL_BONUS[r.pattern] ?? PATTERN_CONTROL_BONUS['other'];
    const spinBonus    = PATTERN_SPIN_BONUS[r.pattern]    ?? PATTERN_SPIN_BONUS['other'];

    const char = CHARACTER_BASE[r.character];

    // 飛び: スイングウェイト・フレームの硬さ・厚み・フェイス面積
    const specPower = 0.35 * nSwingWeight + 0.25 * nRa + 0.25 * nBeamWidth + 0.15 * nHeadSize;
    const power = CHARACTER_WEIGHT.power * char.power + (1 - CHARACTER_WEIGHT.power) * specPower;

    // 収まり: フェイスが小さい / 目が詰まっている / ビームが薄い / ある程度重い（＝面がブレない）
    // フレームの硬さ（RA）はここでは使わない。柔らかさは打球感と衝撃の話で、
    // 収まりを決めるのはフェイス面積・ストリングパターン・重量のため。
    const specControl = 0.40 * iHeadSize + 0.25 * controlBonus + 0.20 * iBeamWidth + 0.15 * nWeight;
    const control = CHARACTER_WEIGHT.control * char.control + (1 - CHARACTER_WEIGHT.control) * specControl;

    // スピン:
    // - ストリングパターン（目が粗いほどストリングが動いて回転がかかる）
    // - メーカーのスピン設計（空力フレーム・グロメット。スペックには出ない）
    // - フェイス面積は「大きいほど良い」ではない。101in²前後がもっともかけやすく、
    //   大きすぎるとストリング密度が下がる
    // - スイングウェイトも「重いほど良い」ではない。振り抜けないとヘッドスピードが出ない
    // スピンは「シリーズの性格」と「ストリングパターン」で大半が決まる。
    // フェイス面積とスイングウェイトは、最適値から離れたぶんだけ引く減点項にする
    // （大きすぎるとストリング密度が下がり、重すぎるとヘッドスピードが出ないため）。
    // 加点項にすると、標準的な 16x19 / 100in² がすべて高得点になってしまう。
    const headPenalty  = Math.abs(r.headSize - SPIN_BEST_HEAD_SIZE) * 0.8;
    const swingPenalty = Math.abs(r.swingWeight - SPIN_BEST_SWING_WEIGHT) * 0.15;
    const spin = clamp100(
      CHARACTER_WEIGHT.spin * char.spin +
      (1 - CHARACTER_WEIGHT.spin) * spinBonus -
      headPenalty - swingPenalty,
    );

    const maneuverability = 0.45 * iWeight + 0.40 * iSwingWeight + 0.15 * iBalance;

    // 腕への優しさ: 柔らかい / ビームが薄い / ある程度重い（軽いほど衝撃が伝わる）／
    // フェイスが大きい（スイートスポットが広く、面を外したときの衝撃が小さい）
    const specComfort = 0.40 * iRa + 0.20 * iBeamWidth + 0.20 * nWeight + 0.20 * nHeadSize;
    const comfort = CHARACTER_WEIGHT.comfort * char.comfort + (1 - CHARACTER_WEIGHT.comfort) * specComfort;

    const volley = 0.35 * iBalance + 0.35 * maneuverability + 0.30 * nWeight;

    const computed: AxisScores = {
      power:           Math.round(power * 10) / 10,
      control:         Math.round(control * 10) / 10,
      spin:            Math.round(spin * 10) / 10,
      maneuverability: Math.round(maneuverability * 10) / 10,
      comfort:         Math.round(comfort * 10) / 10,
      volley:          Math.round(volley * 10) / 10,
    };

    result.set(r.id, r.overrides ? { ...computed, ...r.overrides } : computed);
  }

  return result;
}
