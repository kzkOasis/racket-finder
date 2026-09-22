import type { RacketSpec, AxisScores, Target, ScoredRacket, RankedRacket, HardFilter } from './types';
import { AXES } from './types';
import {
  ONE_SIDED_AXES, SCORE_PENALTY_DIVISOR, POPULARITY_BONUS, BRAND_DIVERSITY_TOLERANCE,
} from './constants';
import { computeAxisScores } from './axes';

function passFilter(racket: RacketSpec, filter: HardFilter): boolean {
  switch (filter.type) {
    case 'weight_max':
      return racket.weight <= filter.value;
    case 'weight_min':
      return racket.weight >= filter.value;
    case 'weight_range':
      return racket.weight >= filter.min && racket.weight <= filter.max;
    case 'ra_max':
      return racket.ra <= filter.value;
    case 'beamWidth_max':
      return racket.beamWidth <= filter.value;
    case 'headSize_min':
      return racket.headSize >= filter.value;
    case 'pattern_exclude':
      return racket.pattern !== filter.value;
    case 'brand':
      return filter.values.includes(racket.brand);
  }
}

function passAllFilters(racket: RacketSpec, filters: HardFilter[]): boolean {
  return filters.every(f => passFilter(racket, f));
}

function calcScore(axisScores: AxisScores, target: Target): number {
  let penalty = 0;
  for (const axis of AXES) {
    const diff = target.ideal[axis] - axisScores[axis];
    const gap = ONE_SIDED_AXES.includes(axis) ? Math.max(0, diff) : Math.abs(diff);
    penalty += target.weight[axis] * gap;
  }
  return Math.max(0, 100 - penalty / SCORE_PENALTY_DIVISOR);
}

export function runDiagnosis(
  rackets: RacketSpec[],
  target: Target,
): {
  candidates: ScoredRacket[];
  top: RankedRacket[];
} {
  const axisScoresMap = computeAxisScores(rackets);

  const candidates = rackets.filter(r => passAllFilters(r, target.filters));
  if (candidates.length === 0) {
    return { candidates: [], top: [] };
  }

  const scored: ScoredRacket[] = candidates.map(r => ({
    racket: r,
    // 定番モデルには加点する。適合度が拮抗したとき、知名度が高く入手しやすい方を選ぶため
    score: Math.min(100, calcScore(axisScoresMap.get(r.id)!, target)
      + (r.popularity === 'high' ? POPULARITY_BONUS : 0)),
    axisScores: axisScoresMap.get(r.id)!,
  }));

  scored.sort((a, b) => b.score - a.score);

  const top = diversify(scored);

  return { candidates: scored, top };
}

/**
 * 候補（スコア降順）から1本選ぶ。僅差なら、まだ出していないブランドのものを優先する。
 * 3本が同じブランドに偏るのを避けるため。
 */
function pickPreferringNewBrand(pool: ScoredRacket[], usedBrands: Set<string>): ScoredRacket {
  const best = pool[0];
  const otherBrand = pool.find(
    s => !usedBrands.has(s.racket.brand) && best.score - s.score <= BRAND_DIVERSITY_TOLERANCE,
  );
  return otherBrand ?? best;
}

export function diversify(scored: ScoredRacket[]): RankedRacket[] {
  if (scored.length === 0) return [];

  const first = scored[0];
  const result: RankedRacket[] = [{ ...first, role: 'best' }];

  const differentFrom1 = scored.filter(s => s.racket.series !== first.racket.series);
  if (differentFrom1.length === 0) return result;

  // 2位: 1位と別シリーズのうち comfort+maneuverability が1位より高いもの中で最高スコア
  const firstCM = first.axisScores.comfort + first.axisScores.maneuverability;
  const rank2pool = differentFrom1.filter(
    s => s.axisScores.comfort + s.axisScores.maneuverability > firstCM,
  );
  const isEasier = rank2pool.length > 0;
  const usedBrands = new Set([first.racket.brand]);
  const second = pickPreferringNewBrand(isEasier ? rank2pool : differentFrom1, usedBrands);
  result.push({ ...second, role: isEasier ? 'easier' : 'alternative' });
  usedBrands.add(second.racket.brand);

  const differentFrom1and2 = scored.filter(
    s => s.racket.series !== first.racket.series && s.racket.series !== second.racket.series,
  );
  if (differentFrom1and2.length === 0) return result;

  // 3位: 1位・2位と別シリーズのうち control+spin が1位より高いもの中で最高スコア
  const firstCS = first.axisScores.control + first.axisScores.spin;
  const rank3pool = differentFrom1and2.filter(
    s => s.axisScores.control + s.axisScores.spin > firstCS,
  );
  const isAggressive = rank3pool.length > 0;
  const third = pickPreferringNewBrand(isAggressive ? rank3pool : differentFrom1and2, usedBrands);
  result.push({ ...third, role: isAggressive ? 'aggressive' : 'alternative' });

  return result;
}
