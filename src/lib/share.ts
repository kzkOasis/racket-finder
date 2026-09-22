import type { Answers, Level, PlayStyle, SwingSize, Problem, ElbowCondition, CurrentWeight, StringType, Gender } from './types';

const LEVELS: Level[] = ['beginner', 'beginnerIntermediate', 'intermediate', 'advanced'];
const PLAY_STYLES: PlayStyle[] = ['baseline', 'allround', 'net'];
const SWING_SIZES: SwingSize[] = ['compact', 'standard', 'full'];
const PROBLEMS: Problem[] = ['noPower', 'tooMuchPower', 'noSpin', 'lateBall', 'armPain'];
const ELBOW_CONDITIONS: ElbowCondition[] = ['none', 'sometimes', 'painful'];
const CURRENT_WEIGHTS: CurrentWeight[] = ['under275', '275to290', '290to305', 'over305', 'unknown'];
const STRING_TYPES: StringType[] = ['poly', 'nylon', 'unknown'];
// 性別は10番目に足す。既存の並びは変えない（古いシェアURLを壊さないため）
const GENDERS: Gender[] = ['unspecified', 'male', 'female'];
// 8番目は廃止した予算の枠。並び順を変えると既存のシェアURLが壊れるので、
// 常に「上限なし」を意味する 3 を書き、読むときは捨てる。
const RESERVED_BUDGET_SLOT = 3;
export const BRANDS = ['Yonex', 'Wilson', 'Babolat', 'Head', 'Dunlop', 'Tecnifibre', 'Prince'] as const;

export function encodeAnswers(answers: Answers): string {
  const q4Encoded = PROBLEMS.reduce((acc, p, i) => {
    return acc | (answers.q4.includes(p) ? (1 << i) : 0);
  }, 0);
  const q9Encoded = BRANDS.reduce((acc, b, i) => {
    return acc | (answers.q9.includes(b) ? (1 << i) : 0);
  }, 0);

  const parts = [
    LEVELS.indexOf(answers.q1),
    PLAY_STYLES.indexOf(answers.q2),
    SWING_SIZES.indexOf(answers.q3),
    q4Encoded,
    ELBOW_CONDITIONS.indexOf(answers.q5),
    CURRENT_WEIGHTS.indexOf(answers.q6),
    STRING_TYPES.indexOf(answers.q7),
    RESERVED_BUDGET_SLOT,
    q9Encoded,
    GENDERS.indexOf(answers.gender),
  ];
  return parts.join('-');
}

/** 選択肢配列のインデックスとして妥当なら値を返す。数値でない・範囲外なら null。 */
function pickOption<T>(options: readonly T[], raw: string): T | null {
  if (!/^\d+$/.test(raw)) return null;
  const index = Number(raw);
  return index < options.length ? options[index] : null;
}

/** ビットフラグとして妥当なら値を返す。数値でない・ビット幅を超えるなら null。 */
function parseBits(raw: string, bitCount: number): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return value < (1 << bitCount) ? value : null;
}

export function decodeAnswers(encoded: string): Answers | null {
  const parts = encoded.split('-');
  // 8パーツ・9パーツの旧形式も受け付ける（後方互換）。性別は10番目
  if (parts.length < 8 || parts.length > 10) return null;

  const q1 = pickOption(LEVELS, parts[0]);
  const q2 = pickOption(PLAY_STYLES, parts[1]);
  const q3 = pickOption(SWING_SIZES, parts[2]);
  const q4bits = parseBits(parts[3], PROBLEMS.length);
  const q5 = pickOption(ELBOW_CONDITIONS, parts[4]);
  const q6 = pickOption(CURRENT_WEIGHTS, parts[5]);
  const q7 = pickOption(STRING_TYPES, parts[6]);
  // 8番目（旧・予算）は値を使わないが、数値であることは確かめる
  const reservedOk = /^\d+$/.test(parts[7]);
  const q9bits = parts.length >= 9 ? parseBits(parts[8], BRANDS.length) : 0;
  // 性別が無い古いURLは「回答しない」として扱う
  const gender = parts.length === 10 ? pickOption(GENDERS, parts[9]) : 'unspecified';

  if (
    q1 === null || q2 === null || q3 === null || q4bits === null ||
    q5 === null || q6 === null || q7 === null || q9bits === null || gender === null || !reservedOk
  ) {
    return null;
  }

  return {
    gender,
    q1,
    q2,
    q3,
    q4: PROBLEMS.filter((_, i) => (q4bits & (1 << i)) !== 0),
    q5,
    q6,
    q7,
    q9: BRANDS.filter((_, i) => (q9bits & (1 << i)) !== 0),
  };
}
