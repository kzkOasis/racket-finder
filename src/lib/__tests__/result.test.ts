import { describe, it, expect } from 'vitest';
import { getTopRacket } from '../result';
import { encodeAnswers } from '../share';
import type { Answers } from '../types';

const answers: Answers = {
  gender: 'unspecified',
  q1: 'beginnerIntermediate',
  q2: 'allround',
  q3: 'standard',
  q4: [],
  q5: 'none',
  q6: '290to305',
  q7: 'nylon',
  q9: [],
};

describe('getTopRacket（OGP画像・メタデータ用）', () => {
  it('正しい回答から1位のラケットを返す', () => {
    const racket = getTopRacket(encodeAnswers(answers));
    expect(racket).not.toBeNull();
    expect(racket!.brand).toBeTruthy();
    expect(racket!.model).toBeTruthy();
  });

  it('空文字は null', () => {
    expect(getTopRacket('')).toBeNull();
  });

  it('要素数が足りない場合は null', () => {
    expect(getTopRacket('0-0-1')).toBeNull();
  });

  it('数値でない場合は null', () => {
    expect(getTopRacket('a-b-c-d-e-f-g-h-i')).toBeNull();
  });

  it('範囲外のインデックスでも例外を投げず null を返す', () => {
    expect(getTopRacket('9-9-9-0-9-9-9-9')).toBeNull();
    expect(getTopRacket('9-9-9-0-9-9-9-9-9')).toBeNull();
  });

  it('旧形式のシェアURL（予算つき9パーツ）も同じ結果になる', () => {
    const current = encodeAnswers(answers);
    // 8番目は廃止した予算の枠。0（〜20,000円）が入った旧URLでも結果は変わらない
    const legacy = current.split('-').map((v, i) => (i === 7 ? '0' : v)).join('-');
    const a = getTopRacket(current);
    const b = getTopRacket(legacy);
    expect(a).not.toBeNull();
    expect(b?.id).toBe(a?.id);
  });
});
