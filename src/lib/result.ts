import { decodeAnswers } from './share';
import { buildTarget } from './target';
import { runDiagnosis } from './score';
import type { RacketSpec } from './types';
import racketData from '@/data/rackets.json';

/**
 * 共有URLの `?a=` から1位のラケットを取り出す。
 * 回答が不正な場合（デコード失敗・候補なし・想定外の例外）は null を返す。
 */
export function getTopRacket(encoded: string): RacketSpec | null {
  if (!encoded) return null;
  try {
    const answers = decodeAnswers(encoded);
    if (!answers) return null;
    const result = runDiagnosis(racketData as RacketSpec[], buildTarget(answers));
    if (result.noCandidates || result.top.length === 0) return null;
    return result.top[0].racket;
  } catch {
    return null;
  }
}
