import type { Axis, AxisScores, Level, PlayStyle, SwingSize, Problem, ElbowCondition, CurrentWeight, StringType } from './types';

// ======= Q1: レベル基準値 =======
//
// 快適性・操作性・ボレーは「足りない分だけ」減点する片側ペナルティなので、
// 理想値は「目標」ではなく「最低ライン」として置く。分布の中央値より大きく
// 上に置くと、超過が減点されないぶん「柔らかく軽いほど得」の並べ替えになり、
// 特定の機種が1位を占めてしまう。

export const BASE_IDEAL: Record<Level, AxisScores> = {
  beginner: {
    power: 75,
    control: 40,
    spin: 45,
    maneuverability: 62,
    // 掲載機種の快適性の最大は73。理想値がそれを超えると「柔らかいほど良い」の
    // 並べ替えになってしまうため、到達可能な範囲に収めている
    comfort: 62,
    volley: 50,
  },
  beginnerIntermediate: {
    power: 68,
    control: 50,
    spin: 55,
    maneuverability: 55,
    comfort: 58,
    volley: 52,
  },
  intermediate: {
    power: 55,
    control: 62,
    spin: 65,
    maneuverability: 48,
    comfort: 50,
    volley: 55,
  },
  advanced: {
    power: 45,
    control: 75,
    spin: 70,
    maneuverability: 42,
    comfort: 40,
    volley: 58,
  },
};

export const BASE_WEIGHT: Record<Level, Record<Axis, number>> = {
  beginner: {
    power: 1.2,
    control: 0.6,
    spin: 0.6,
    maneuverability: 1.5,
    comfort: 1.5,
    volley: 0.8,
  },
  beginnerIntermediate: {
    power: 1.1,
    control: 0.9,
    spin: 1.0,
    maneuverability: 1.2,
    comfort: 1.2,
    volley: 0.9,
  },
  intermediate: {
    power: 1.0,
    control: 1.2,
    spin: 1.2,
    maneuverability: 1.0,
    comfort: 1.0,
    volley: 1.0,
  },
  advanced: {
    power: 0.9,
    control: 1.5,
    spin: 1.3,
    maneuverability: 0.9,
    comfort: 0.8,
    volley: 1.1,
  },
};

// ======= Q2: プレースタイル差分 =======

export const PLAY_STYLE_IDEAL_DELTA: Record<PlayStyle, Partial<AxisScores>> = {
  baseline: { spin: 8 },
  allround: {},
  net: { volley: 15, maneuverability: 8 },
};

export const PLAY_STYLE_WEIGHT_MUL: Record<PlayStyle, Partial<Record<Axis, number>>> = {
  baseline: { spin: 1.5, power: 1.2, volley: 0.5 },
  allround: {},
  net: { volley: 2.0, maneuverability: 1.4, spin: 0.6 },
};

// ======= Q3: スイングの大きさ差分 =======

export const SWING_SIZE_IDEAL_DELTA: Record<SwingSize, Partial<AxisScores>> = {
  compact: { power: 15, comfort: 5 },
  standard: {},
  full: { power: -18, control: 10, spin: 8 },
};

export const SWING_SIZE_WEIGHT_MUL: Record<SwingSize, Partial<Record<Axis, number>>> = {
  compact: { power: 1.3 },
  standard: {},
  full: { control: 1.2 },
};

// ======= Q4: 困りごと差分 =======

export const PROBLEM_IDEAL_DELTA: Record<Problem, Partial<AxisScores>> = {
  noPower: { power: 15 },
  tooMuchPower: { power: -20, control: 15 },
  noSpin: { spin: 25 },
  lateBall: { maneuverability: 15 },
  armPain: { comfort: 15 },
};

export const PROBLEM_WEIGHT_MUL: Record<Problem, Partial<Record<Axis, number>>> = {
  noPower: { power: 2.5 },
  tooMuchPower: { control: 2.5 },
  noSpin: { spin: 2.5 },
  lateBall: { maneuverability: 2.5 },
  armPain: { comfort: 2.5 },
};

// Q4の2つ目の選択肢の重み倍率固定値
export const PROBLEM_SECOND_WEIGHT_MUL = 1.5;

// ======= Q5: 肘・肩の不安 差分 =======

export const ELBOW_IDEAL_DELTA: Record<ElbowCondition, Partial<AxisScores>> = {
  none: {},
  sometimes: { comfort: 8 },
  painful: { comfort: 15 },
};

export const ELBOW_WEIGHT_MUL: Record<ElbowCondition, Partial<Record<Axis, number>>> = {
  none: {},
  sometimes: { comfort: 1.8 },
  painful: { comfort: 3.0 },
};

// ======= Q6: 現在の重量範囲 =======

export const CURRENT_WEIGHT_RANGE: Record<Exclude<CurrentWeight, 'unknown'>, [number, number]> = {
  under275: [240, 290],  // 240g台の超軽量モデルも候補に入るようにする
  '275to290': [265, 300],
  '290to305': [280, 315],
  over305: [295, 330],
};

// Q6「わからない」の推定表
export const UNKNOWN_WEIGHT_RANGE: Record<Level, Record<SwingSize, [number, number]>> = {
  beginner: {
    compact: [265, 290],
    standard: [270, 295],
    full: [275, 300],
  },
  beginnerIntermediate: {
    compact: [270, 295],
    standard: [280, 300],
    full: [285, 305],
  },
  intermediate: {
    compact: [280, 300],
    standard: [285, 305],
    full: [290, 315],
  },
  advanced: {
    compact: [285, 305],
    standard: [295, 315],
    full: [300, 330],
  },
};

// ======= Q7: ストリング差分 =======

export const STRING_TYPE_IDEAL_DELTA: Record<StringType, Partial<AxisScores>> = {
  poly: { power: 10, comfort: 8 },
  nylon: { power: -5, control: 5 },
  unknown: { power: -5, control: 5 },
};

// ======= Q8: 予算 =======


// ======= パターンボーナス =======

/**
 * 6軸スコアの正規化に使う実用レンジ（この範囲を 0〜100 に写す）。
 * データセットの最小・最大ではなく固定値にすることで、
 * 機種を足してもほかの機種のスコアが動かないようにしている。
 */
export const SPEC_RANGES = {
  weight: [250, 320],
  balance: [310, 345],
  swingWeight: [250, 330],
  headSize: [95, 110],
  ra: [55, 72],
  beamWidth: [20, 28],
} as const satisfies Record<string, readonly [number, number]>;

export const PATTERN_CONTROL_BONUS: Record<string, number> = {
  '18x20': 100,
  '16x20': 65,
  '16x19': 35,
  other: 50,
};

export const PATTERN_SPIN_BONUS: Record<string, number> = {
  '18x20': 15,
  '16x20': 55,
  '16x19': 90,
  other: 50,
};

/** スピンがもっともかけやすいフェイス面積（これより大小どちらに離れても下がる） */
export const SPIN_BEST_HEAD_SIZE = 101;

/** 同じくスイングウェイト。重すぎると振り抜けずヘッドスピードが出ない */
export const SPIN_BEST_SWING_WEIGHT = 305;

/**
 * 初級・初中級に出さないフェイス面積の下限。
 * 95〜97in² のプレイヤーズラケットはスイートスポットが狭く、
 * ミスヒット時の衝撃も大きいため、このレベルには勧めない。
 */
export const BEGINNER_HEAD_SIZE_MIN = 98;

// ======= スコアリング定数 =======

export const ONE_SIDED_AXES: Axis[] = ['comfort', 'maneuverability', 'volley'];
export const SCORE_PENALTY_DIVISOR = 6.0;
export const WEIGHT_NORMALIZE_TARGET = 6.0;

// ======= ハードフィルタ定数 =======

export const ELBOW_RA_MAX_SOMETIMES = 70;
export const ELBOW_RA_MAX_PAINFUL = 66;
export const ELBOW_BEAM_WIDTH_MAX_PAINFUL = 24;
export const ELBOW_WEIGHT_MIN_PAINFUL = 285; // 意図的な仕様。削除不可
