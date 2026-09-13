import { describe, it } from 'vitest';
import { computeAxisScores } from '../axes';
import rackets from '../../data/rackets.json';
import type { RacketSpec } from '../types';

describe('6軸スコア算出テーブル', () => {
  it('全ラケットのスコアを表示する', () => {
    const scores = computeAxisScores(rackets as RacketSpec[]);

    const header = ['モデル'.padEnd(25), 'power', 'ctrl', 'spin', 'maneuv', 'comf', 'volley'].join('\t');
    console.log(header);
    console.log('-'.repeat(80));

    for (const r of rackets as RacketSpec[]) {
      const s = scores.get(r.id)!;
      const row = [
        r.model.padEnd(25),
        s.power.toFixed(1).padStart(5),
        s.control.toFixed(1).padStart(5),
        s.spin.toFixed(1).padStart(5),
        s.maneuverability.toFixed(1).padStart(6),
        s.comfort.toFixed(1).padStart(5),
        s.volley.toFixed(1).padStart(6),
      ].join('\t');
      console.log(row);
    }
  });
});
