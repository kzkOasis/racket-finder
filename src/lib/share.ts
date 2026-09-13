import type { Answers, Level, PlayStyle, SwingSize, Problem, ElbowCondition, CurrentWeight, StringType, Budget } from './types';

const LEVELS: Level[] = ['beginner', 'beginnerIntermediate', 'intermediate', 'advanced'];
const PLAY_STYLES: PlayStyle[] = ['baseline', 'allround', 'net'];
const SWING_SIZES: SwingSize[] = ['compact', 'standard', 'full'];
const PROBLEMS: Problem[] = ['noPower', 'tooMuchPower', 'noSpin', 'lateBall', 'armPain'];
const ELBOW_CONDITIONS: ElbowCondition[] = ['none', 'sometimes', 'painful'];
const CURRENT_WEIGHTS: CurrentWeight[] = ['under275', '275to290', '290to305', 'over305', 'unknown'];
const STRING_TYPES: StringType[] = ['poly', 'nylon', 'unknown'];
const BUDGETS: (Budget | 'unlimited')[] = [20000, 30000, 40000, null];
export const BRANDS = ['Yonex', 'Wilson', 'Babolat', 'Head', 'Dunlop', 'Technifibre', 'Prince'] as const;

export function encodeAnswers(answers: Answers): string {
  const q4Encoded = PROBLEMS.reduce((acc, p, i) => {
    return acc | (answers.q4.includes(p) ? (1 << i) : 0);
  }, 0);
  const budgetIdx = answers.q8 === null ? 3 : BUDGETS.indexOf(answers.q8);
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
    budgetIdx,
    q9Encoded,
  ];
  return parts.join('-');
}

export function decodeAnswers(encoded: string): Answers | null {
  try {
    const parts = encoded.split('-').map(Number);
    // 8パーツ（旧形式）も受け付ける（後方互換）
    if (parts.length !== 8 && parts.length !== 9) return null;
    const [q1i, q2i, q3i, q4bits, q5i, q6i, q7i, q8i, q9bits = 0] = parts;

    const q4 = PROBLEMS.filter((_, i) => (q4bits & (1 << i)) !== 0);
    const q8raw = BUDGETS[q8i];
    const q8 = q8raw === 'unlimited' ? null : (q8raw as Budget);
    const q9 = BRANDS.filter((_, i) => (q9bits & (1 << i)) !== 0);

    return {
      q1: LEVELS[q1i],
      q2: PLAY_STYLES[q2i],
      q3: SWING_SIZES[q3i],
      q4,
      q5: ELBOW_CONDITIONS[q5i],
      q6: CURRENT_WEIGHTS[q6i],
      q7: STRING_TYPES[q7i],
      q8,
      q9,
    };
  } catch {
    return null;
  }
}
