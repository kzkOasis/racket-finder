import { describe, it, expect } from 'vitest';
import { generateReason, generateReasons, selectReasonAxes, STRONG } from '../reason';
import { buildTarget } from '../target';
import { runDiagnosis } from '../score';
import { AXES } from '../types';
import type { Answers, Axis, AxisScores, RacketSpec, Target } from '../types';
import racketData from '../../data/rackets.json';

const rackets = racketData as RacketSpec[];

const baseAnswers: Answers = {
  q1: 'beginnerIntermediate',
  q2: 'allround',
  q3: 'standard',
  q4: [],
  q5: 'none',
  q6: '290to305',
  q7: 'nylon',
  q9: [],
};

function scores(over: Partial<AxisScores> = {}): AxisScores {
  return { power: 50, control: 50, spin: 50, maneuverability: 50, comfort: 50, volley: 50, ...over };
}

/** 快適性の重みが最大になるターゲット（肘に痛みがある回答） */
const comfortTarget: Target = buildTarget({ ...baseAnswers, q5: 'painful' });

describe('軸の選び方', () => {
  it('重視する軸でそのラケットが強ければ、その軸を主役にする', () => {
    const axes = selectReasonAxes(scores({ comfort: 80 }), comfortTarget);
    expect(axes.main).toBe('comfort');
    expect(axes.matchesPriority).toBe(true);
  });

  it('重視する軸が弱ければ、ラケット自身のいちばん高い軸で説明する', () => {
    const axes = selectReasonAxes(scores({ comfort: 20, spin: 85 }), comfortTarget);
    expect(axes.main).toBe('spin');
  });

  it('すでに使った軸は避ける（3本で同じ文にしないため）', () => {
    const s = scores({ comfort: 80, control: 75 });
    const first = selectReasonAxes(s, comfortTarget);
    const second = selectReasonAxes(s, comfortTarget, new Set<Axis>([first.main]));
    expect(second.main).not.toBe(first.main);
  });

  it('補足の軸も STRONG 未満なら選ばない', () => {
    const axes = selectReasonAxes(scores({ comfort: 80, control: 30, spin: 30, power: 30, maneuverability: 30, volley: 30 }), comfortTarget);
    expect(axes.sub).toBeNull();
  });
});

describe('文面', () => {
  it('スコアが低い軸を「優れている」と書かない（P1-4の不具合）', () => {
    // 操作性20のラケットに「振り抜きが軽い」「取り回しも軽め」とは書かない
    const text = generateReason('テスト', scores({ comfort: 80, maneuverability: 20 }), comfortTarget);
    expect(text).not.toContain('振り抜きが軽い');
    expect(text).not.toContain('取り回しも軽め');
    expect(text).toContain('フレームが柔らかく');
  });

  it('快適性が低いラケットに「フレームが柔らかく」と書かない', () => {
    const text = generateReason('テスト', scores({ comfort: 13, spin: 80 }), comfortTarget);
    expect(text).not.toContain('フレームが柔らかく');
    expect(text).not.toContain('腕への負担');
  });

  it('モデル名が入る', () => {
    expect(generateReason('EZONE 100', scores({ comfort: 80 }), comfortTarget)).toContain('EZONE 100');
  });
});

describe('実データでの性質', () => {
  const patterns: Answers[] = [
    baseAnswers,
    { ...baseAnswers, q1: 'beginner', q4: ['noPower'], q6: 'under275' },
    { ...baseAnswers, q1: 'advanced', q2: 'net', q3: 'full', q4: ['noSpin'], q6: 'over305', q7: 'poly' },
    { ...baseAnswers, q5: 'painful' },
    { ...baseAnswers, q4: ['armPain', 'lateBall'] },
  ];

  it('言及する軸は必ずそのラケットで STRONG 以上（持ち味で説明する場合を除く）', () => {
    for (const a of patterns) {
      const target = buildTarget(a);
      const top = runDiagnosis(rackets, target).top;
      const used = new Set<Axis>();
      for (const item of top) {
        const axes = selectReasonAxes(item.axisScores, target, used);
        used.add(axes.main);
        if (axes.matchesPriority) {
          expect(item.axisScores[axes.main], `${item.racket.model} の ${axes.main}`).toBeGreaterThanOrEqual(STRONG);
        }
        if (axes.sub) {
          expect(item.axisScores[axes.sub], `${item.racket.model} の ${axes.sub}`).toBeGreaterThanOrEqual(STRONG);
        }
      }
    }
  });

  it('持ち味で説明する場合、その軸はそのラケットで最も高い軸', () => {
    for (const a of patterns) {
      const target = buildTarget(a);
      for (const item of runDiagnosis(rackets, target).top) {
        const axes = selectReasonAxes(item.axisScores, target);
        if (!axes.matchesPriority) {
          const best = Math.max(...(AXES as readonly Axis[]).map(x => item.axisScores[x]));
          expect(item.axisScores[axes.main]).toBe(best);
        }
      }
    }
  });

  it('3本の理由文がそれぞれ異なる', () => {
    for (const a of patterns) {
      const target = buildTarget(a);
      const top = runDiagnosis(rackets, target).top;
      const reasons = generateReasons(top, target);
      expect(new Set(reasons).size).toBe(reasons.length);
      // モデル名を除いても文型が全部同じにはならない
      const templates = reasons.map((r, i) => r.replace(top[i].racket.model, ''));
      expect(new Set(templates).size).toBeGreaterThan(1);
    }
  });
});
