import { describe, it, expect } from 'vitest';
import { describeStrengths, describeCautions, specSummary } from '../suitability';
import { computeAxisScores } from '../axes';
import type { AxisScores, RacketSpec } from '../types';
import racketData from '../../data/rackets.json';

function scores(over: Partial<AxisScores> = {}): AxisScores {
  return { power: 50, control: 50, spin: 50, maneuverability: 50, comfort: 50, volley: 50, ...over };
}

describe('describeStrengths', () => {
  it('高いスコアの軸を最大2つ取り上げる', () => {
    const result = describeStrengths(scores({ power: 90, comfort: 80, spin: 20 }));
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('飛びます');   // power
    expect(result[1]).toContain('衝撃');       // comfort
  });

  it('突出した軸がなくても必ず1つは返す（空にしない）', () => {
    const result = describeStrengths(scores({ control: 55 }));
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('狙ったところ');
  });

  it('スコアが高い順に並ぶ', () => {
    const result = describeStrengths(scores({ volley: 95, power: 70 }));
    expect(result[0]).toContain('ネット前');
  });
});

describe('describeCautions', () => {
  it('いちばん低い軸が閾値を下回るときだけ注意点を返す', () => {
    expect(describeCautions(scores({ comfort: 20 }))[0]).toContain('硬め');
    expect(describeCautions(scores())).toEqual([]);
  });

  it('医療的な断定をしない（「注意してください」にとどめる）', () => {
    const caution = describeCautions(scores({ comfort: 10 }))[0];
    expect(caution).toContain('注意してください');
    expect(caution).not.toContain('治り');
    expect(caution).not.toContain('痛みが');
  });
});

describe('掲載中の全ラケット', () => {
  const rackets = racketData as RacketSpec[];
  const map = computeAxisScores(rackets);

  it('40本すべてで「向いている人」が1つ以上出る', () => {
    for (const r of rackets) {
      const s = map.get(r.id)!;
      expect(describeStrengths(s).length, `${r.brand} ${r.model}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('スペック要約に重さとフェイス面積が入る', () => {
    const summary = specSummary(rackets[0]);
    expect(summary).toContain(`${rackets[0].weight}g`);
    expect(summary).toContain(`${rackets[0].headSize}平方インチ`);
  });
});
