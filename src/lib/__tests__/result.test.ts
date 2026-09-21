import { describe, it, expect } from 'vitest';
import { getTopRacket } from '../result';
import { encodeAnswers } from '../share';
import type { Answers } from '../types';

const answers: Answers = {
  q1: 'beginnerIntermediate',
  q2: 'allround',
  q3: 'standard',
  q4: [],
  q5: 'none',
  q6: '290to305',
  q7: 'nylon',
  q8: null,
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

  it('予算内に候補がない場合は null', () => {
    // 予算2万円以下 & Prince のみ（Prince の最安は26,000円）
    const encoded = encodeAnswers({ ...answers, q8: 20000, q9: ['Prince'] });
    expect(getTopRacket(encoded)).toBeNull();
  });
});
