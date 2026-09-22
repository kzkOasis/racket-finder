import type { Answers, Target, AxisScores, Axis, HardFilter } from './types';
import { AXES } from './types';
import {
  BASE_IDEAL, BASE_WEIGHT,
  PLAY_STYLE_IDEAL_DELTA, PLAY_STYLE_WEIGHT_MUL,
  SWING_SIZE_IDEAL_DELTA, SWING_SIZE_WEIGHT_MUL,
  PROBLEM_IDEAL_DELTA, PROBLEM_WEIGHT_MUL, PROBLEM_SECOND_WEIGHT_MUL,
  ELBOW_IDEAL_DELTA, ELBOW_WEIGHT_MUL,
  STRING_TYPE_IDEAL_DELTA,
  CURRENT_WEIGHT_RANGE, UNKNOWN_WEIGHT_RANGE,
  WEIGHT_NORMALIZE_TARGET,
  ELBOW_RA_MAX_SOMETIMES, ELBOW_RA_MAX_PAINFUL,
  ELBOW_BEAM_WIDTH_MAX_PAINFUL, ELBOW_WEIGHT_MIN_PAINFUL,
  BEGINNER_HEAD_SIZE_MIN, GENDER_WEIGHT_SHIFT,
} from './constants';

function applyDelta(ideal: AxisScores, delta: Partial<AxisScores>): void {
  for (const axis of AXES) {
    if (delta[axis] !== undefined) {
      ideal[axis] += delta[axis]!;
    }
  }
}

function applyMul(weight: Record<Axis, number>, mul: Partial<Record<Axis, number>>): void {
  for (const axis of AXES) {
    if (mul[axis] !== undefined) {
      weight[axis] *= mul[axis]!;
    }
  }
}

function clamp(ideal: AxisScores, min: number, max: number): void {
  for (const axis of AXES) {
    ideal[axis] = Math.min(max, Math.max(min, ideal[axis]));
  }
}

function normalizeWeight(weight: Record<Axis, number>, target: number): void {
  const sum = AXES.reduce((acc, axis) => acc + weight[axis], 0);
  if (sum === 0) return;
  const factor = target / sum;
  for (const axis of AXES) {
    weight[axis] *= factor;
  }
}

export function buildTarget(answers: Answers): Target {
  const ideal: AxisScores = { ...BASE_IDEAL[answers.q1] };
  const weight: Record<Axis, number> = { ...BASE_WEIGHT[answers.q1] };
  const filters: HardFilter[] = [];

  // Q2
  applyDelta(ideal, PLAY_STYLE_IDEAL_DELTA[answers.q2]);
  applyMul(weight, PLAY_STYLE_WEIGHT_MUL[answers.q2]);

  // Q3
  applyDelta(ideal, SWING_SIZE_IDEAL_DELTA[answers.q3]);
  applyMul(weight, SWING_SIZE_WEIGHT_MUL[answers.q3]);

  // Q4（最大2つ）
  if (answers.q4.length >= 1) {
    const first = answers.q4[0];
    applyDelta(ideal, PROBLEM_IDEAL_DELTA[first]);
    applyMul(weight, PROBLEM_WEIGHT_MUL[first]);
  }
  if (answers.q4.length >= 2) {
    const second = answers.q4[1];
    applyDelta(ideal, PROBLEM_IDEAL_DELTA[second]);
    // 2つ目は各軸の倍率を PROBLEM_SECOND_WEIGHT_MUL に固定
    const secondMul: Partial<Record<Axis, number>> = {};
    const originalMul = PROBLEM_WEIGHT_MUL[second];
    for (const axis of AXES) {
      if (originalMul[axis] !== undefined) {
        secondMul[axis] = PROBLEM_SECOND_WEIGHT_MUL;
      }
    }
    applyMul(weight, secondMul);
  }

  // Q4 ハードフィルタ
  for (const problem of answers.q4) {
    if (problem === 'noSpin') {
      filters.push({ type: 'pattern_exclude', value: '18x20' });
    }
    if (problem === 'lateBall') {
      // Q6 の上限値を使う
      if (answers.q6 !== 'unknown') {
        const range = CURRENT_WEIGHT_RANGE[answers.q6];
        filters.push({ type: 'weight_max', value: range[1] });
      } else {
        const range = UNKNOWN_WEIGHT_RANGE[answers.q1][answers.q3];
        filters.push({ type: 'weight_max', value: range[1] });
      }
    }
  }

  // Q5
  applyDelta(ideal, ELBOW_IDEAL_DELTA[answers.q5]);
  applyMul(weight, ELBOW_WEIGHT_MUL[answers.q5]);

  if (answers.q5 === 'sometimes') {
    filters.push({ type: 'ra_max', value: ELBOW_RA_MAX_SOMETIMES });
  } else if (answers.q5 === 'painful') {
    filters.push({ type: 'ra_max', value: ELBOW_RA_MAX_PAINFUL });
    filters.push({ type: 'beamWidth_max', value: ELBOW_BEAM_WIDTH_MAX_PAINFUL });
    filters.push({ type: 'weight_min', value: ELBOW_WEIGHT_MIN_PAINFUL });
  }

  // Q6: 重量フィルタ（性別ぶんだけ軽い側にずらす）
  const weightShift = GENDER_WEIGHT_SHIFT[answers.gender];
  if (answers.q6 !== 'unknown') {
    const [min, max] = CURRENT_WEIGHT_RANGE[answers.q6];
    filters.push({ type: 'weight_range', min: min + weightShift, max: max + weightShift });
  } else {
    const [min, max] = UNKNOWN_WEIGHT_RANGE[answers.q1][answers.q3];
    filters.push({ type: 'weight_range', min: min + weightShift, max: max + weightShift });
  }

  // Q7
  applyDelta(ideal, STRING_TYPE_IDEAL_DELTA[answers.q7]);

  // クランプ
  clamp(ideal, 0, 100);

  // 重みの正規化
  normalizeWeight(weight, WEIGHT_NORMALIZE_TARGET);

  // Q1: 初級・初中級には、スイートスポットの狭い上級者向けフェイスを出さない
  if (answers.q1 === 'beginner' || answers.q1 === 'beginnerIntermediate') {
    filters.push({ type: 'headSize_min', value: BEGINNER_HEAD_SIZE_MIN });
  }

  // Q9: ブランドフィルタ
  if (answers.q9.length > 0) {
    filters.push({ type: 'brand', values: answers.q9 });
  }

  return { ideal, weight, filters };
}
