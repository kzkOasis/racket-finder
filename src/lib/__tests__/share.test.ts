import { describe, it, expect } from 'vitest';
import { encodeAnswers, decodeAnswers, BRANDS } from '../share';
import type { Answers } from '../types';

const answers: Answers = {
  q1: 'intermediate',
  q2: 'net',
  q3: 'full',
  q4: ['noPower', 'armPain'],
  q5: 'sometimes',
  q6: 'over305',
  q7: 'poly',
  q9: ['Yonex', 'Prince'],
};

describe('encode → decode', () => {
  it('往復して同じ回答に戻る', () => {
    expect(decodeAnswers(encodeAnswers(answers))).toEqual(answers);
  });

  it('8番目は予約枠なので常に 3 が入る', () => {
    expect(encodeAnswers(answers).split('-')[7]).toBe('3');
  });

  it('8番目の値が何であっても結果は変わらない（旧・予算の互換）', () => {
    const encoded = encodeAnswers(answers).split('-');
    for (const slot of ['0', '1', '2', '3']) {
      const legacy = encoded.map((v, i) => (i === 7 ? slot : v)).join('-');
      expect(decodeAnswers(legacy)).toEqual(answers);
    }
  });

  it('9番目が無い旧々形式（8パーツ）はブランド指定なしとして読む', () => {
    const eight = encodeAnswers(answers).split('-').slice(0, 8).join('-');
    expect(decodeAnswers(eight)).toEqual({ ...answers, q9: [] });
  });
});

describe('不正なURLを弾く（P1-2）', () => {
  it('範囲外のインデックスは null', () => {
    // 以前はここで buildTarget が例外を投げ、英語のエラー画面になっていた
    expect(decodeAnswers('9-9-9-0-9-9-9-9')).toBeNull();
    expect(decodeAnswers('4-0-0-0-0-0-0-3-0')).toBeNull(); // q1 は4択
    expect(decodeAnswers('0-3-0-0-0-0-0-3-0')).toBeNull(); // q2 は3択
    expect(decodeAnswers('0-0-0-0-0-5-0-3-0')).toBeNull(); // q6 は5択
  });

  it('数値でない値は null', () => {
    expect(decodeAnswers('abc')).toBeNull();
    expect(decodeAnswers('a-b-c-d-e-f-g-h-i')).toBeNull();
    expect(decodeAnswers('0-0-0-0-0-0-0-x-0')).toBeNull();
    expect(decodeAnswers('0.5-0-0-0-0-0-0-3-0')).toBeNull();
    expect(decodeAnswers('0-0-0-0-0-0-0- 1-0')).toBeNull();
  });

  it('空文字・要素数不足・要素数超過は null', () => {
    expect(decodeAnswers('')).toBeNull();
    expect(decodeAnswers('0-0-0')).toBeNull();
    expect(decodeAnswers('0-0-0-0-0-0-0')).toBeNull();
    expect(decodeAnswers('0-0-0-0-0-0-0-3-0-0')).toBeNull();
    expect(decodeAnswers('0-0-0-0-0-0-0--0')).toBeNull(); // 空の要素
  });

  it('負数は null（Number では通ってしまうため）', () => {
    expect(decodeAnswers('-1-0-0-0-0-0-0-3-0')).toBeNull();
  });

  it('ビット幅を超えるフラグは null', () => {
    expect(decodeAnswers('0-0-0-32-0-0-0-3-0')).toBeNull();  // 困りごとは5種類 = 最大31
    expect(decodeAnswers('0-0-0-0-0-0-0-3-128')).toBeNull(); // ブランドは7種類 = 最大127
  });

  it('ビット幅の上限ちょうどは受け付ける', () => {
    const all = decodeAnswers('0-0-0-31-0-0-0-3-127');
    expect(all).not.toBeNull();
    expect(all!.q4).toHaveLength(5);
    expect(all!.q9).toHaveLength(BRANDS.length);
  });
});
