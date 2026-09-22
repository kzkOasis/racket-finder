import { describe, it, expect } from 'vitest';
import { buildTarget } from '../target';
import { runDiagnosis } from '../score';
import type { Answers, Level, PlayStyle, SwingSize, ElbowCondition, CurrentWeight, StringType, Problem, RacketSpec } from '../types';
import racketData from '../../data/rackets.json';

/**
 * 診断結果の妥当性テスト。
 * 「テニス的にこうあるべき」を先に書き、6軸スコアの式がそれを満たすことを確認する。
 */

const rackets = racketData as RacketSpec[];

const base: Answers = {
  q1: 'intermediate', q2: 'allround', q3: 'standard',
  q4: [], q5: 'none', q6: '290to305', q7: 'nylon', q9: [],
};

function top(overrides: Partial<Answers>) {
  const answers = { ...base, ...overrides };
  return runDiagnosis(rackets, buildTarget(answers)).top;
}

describe('回答に対して納得のいく機種が出る', () => {
  it('初級・飛ばない・コンパクトスイング → 飛ぶ設計（大きめフェイス＋厚ラケか高RA）が1位', () => {
    const first = top({ q1: 'beginner', q3: 'compact', q4: ['noPower'], q6: 'under275' })[0].racket;
    expect(first.headSize, `${first.model} のフェイス`).toBeGreaterThanOrEqual(100);
    expect(first.ra >= 65 || first.beamWidth >= 24, `${first.model} RA${first.ra} ビーム${first.beamWidth}`).toBe(true);
  });

  it('上級・飛びすぎる・フルスイング → 抑えめの設計（小さめフェイス＋薄ビーム）が1位', () => {
    const first = top({ q1: 'advanced', q3: 'full', q4: ['tooMuchPower'], q6: 'over305', q7: 'poly' })[0].racket;
    expect(first.headSize, `${first.model} のフェイス`).toBeLessThanOrEqual(100);
    expect(first.beamWidth, `${first.model} のビーム厚`).toBeLessThanOrEqual(24);
  });

  it('肘に痛みがある → 柔らかく、スイートスポットが狭すぎない機種が1位', () => {
    for (const q1 of ['beginner', 'beginnerIntermediate', 'intermediate'] as Level[]) {
      const first = top({ q1, q5: 'painful' })[0].racket;
      expect(first.ra, `${q1}: ${first.model} のRA`).toBeLessThanOrEqual(68);
      // 97in²のような上級者向けの小さいフェイスを、肘に不安がある人の1位にしない
      expect(first.headSize, `${q1}: ${first.model} のフェイス`).toBeGreaterThanOrEqual(100);
      expect(first.weight, `${q1}: ${first.model} の重さ`).toBeGreaterThanOrEqual(285);
    }
  });

  it('初級 → スイングウェイトが重すぎる機種を1位にしない', () => {
    for (const q3 of ['compact', 'standard'] as SwingSize[]) {
      const first = top({ q1: 'beginner', q3, q6: 'under275' })[0].racket;
      expect(first.swingWeight, `${first.model} のスイングウェイト`).toBeLessThanOrEqual(310);
    }
  });

  it('スピンがかからない → 目の粗いパターン（16x19など）が1位', () => {
    const first = top({ q4: ['noSpin'], q7: 'poly' })[0].racket;
    expect(first.pattern, `${first.model} のパターン`).not.toBe('18x20');
  });
});

describe('提案の偏り', () => {
  const levels: Level[] = ['beginner', 'beginnerIntermediate', 'intermediate', 'advanced'];
  const styles: PlayStyle[] = ['baseline', 'allround', 'net'];
  const swings: SwingSize[] = ['compact', 'standard', 'full'];
  const elbows: ElbowCondition[] = ['none', 'sometimes', 'painful'];
  const weights: CurrentWeight[] = ['under275', '275to290', '290to305', 'over305', 'unknown'];
  const strings: StringType[] = ['poly', 'nylon', 'unknown'];
  // Q4 は最大2つ選べるので、組み合わせも含める
  const problems: Problem[][] = [
    [], ['noPower'], ['tooMuchPower'], ['noSpin'], ['lateBall'], ['armPain'],
    ['noPower', 'noSpin'], ['tooMuchPower', 'noSpin'], ['lateBall', 'armPain'],
  ];

  const rank1 = new Map<string, number>();
  const inTop3 = new Set<string>();
  let total = 0;
  for (const q1 of levels) for (const q2 of styles) for (const q3 of swings) for (const q5 of elbows)
  for (const q6 of weights) for (const q7 of strings) for (const q4 of problems) {
    const t = runDiagnosis(rackets, buildTarget({ q1, q2, q3, q4, q5, q6, q7, q9: [] })).top;
    total++;
    if (t[0]) rank1.set(t[0].racket.id, (rank1.get(t[0].racket.id) ?? 0) + 1);
    for (const x of t) inTop3.add(x.racket.id);
  }

  // 「診断」として成立させるための回帰ガード。特定の値を狙うものではなく、
  // 式や理想値をいじったときに、また1機種が1位を占めていないかを見る。
  // 実装時点: 最多25%、上位3機種で50%、1位になる機種は35/40本。
  it('1機種が1位を占める割合が30%以下', () => {
    const [id, n] = [...rank1.entries()].sort((a, b) => b[1] - a[1])[0];
    const model = rackets.find(r => r.id === id)!.model;
    expect(Math.round((n / total) * 100), `最多は ${model}`).toBeLessThanOrEqual(30);
  });

  it('上位3機種の合計が60%以下', () => {
    const top3 = [...rank1.values()].sort((a, b) => b - a).slice(0, 3).reduce((s, n) => s + n, 0);
    expect(Math.round((top3 / total) * 100)).toBeLessThanOrEqual(60);
  });

  it('25本以上が1位になりうる', () => {
    expect(rank1.size).toBeGreaterThanOrEqual(25);
  });

  it('一度も3本に入らない機種が6本以下', () => {
    const never = rackets.filter(r => !inTop3.has(r.id)).map(r => `${r.brand} ${r.model}`);
    expect(never.length, `出てこない機種: ${never.join(', ')}`).toBeLessThanOrEqual(6);
  });

  // 日本の量販上位のシリーズ。ここが一度も出ないと「自分のラケットが出てこない」
  // という不信につながる（実際にそう指摘された）
  it('主力モデルはどこかの回答で3本に入る', () => {
    for (const model of ['EZONE 100', 'Pure Aero', 'Pure Drive', 'VCORE 100']) {
      const r = rackets.find(x => x.model === model)!;
      expect(inTop3.has(r.id), `${model} が一度も出てこない`).toBe(true);
    }
  });
});
