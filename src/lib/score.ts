import type { RacketSpec, AxisScores, Target, ScoredRacket, HardFilter } from './types';
import { AXES } from './types';
import { ONE_SIDED_AXES, SCORE_PENALTY_DIVISOR } from './constants';
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
    case 'pattern_exclude':
      return racket.pattern !== filter.value;
    case 'price_max':
      return racket.price <= filter.value;
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
  top: ScoredRacket[];
  noCandidates: boolean;
  budgetNeeded?: number;
} {
  const axisScoresMap = computeAxisScores(rackets);

  // ハードフィルタ（予算フィルタを除く）で候補を絞る
  const budgetFilter = target.filters.find(f => f.type === 'price_max');
  const otherFilters = target.filters.filter(f => f.type !== 'price_max');

  const preFilter = rackets.filter(r => passAllFilters(r, otherFilters));

  // 予算フィルタを適用
  const candidates = budgetFilter
    ? preFilter.filter(r => passFilter(r, budgetFilter))
    : preFilter;

  if (candidates.length === 0) {
    // 予算を除いた候補があるか確認
    const withoutBudget = preFilter;
    if (budgetFilter && withoutBudget.length > 0) {
      // 予算を段階的に上げて最小限の予算を探す
      const sorted = withoutBudget.sort((a, b) => a.price - b.price);
      return {
        candidates: [],
        top: [],
        noCandidates: true,
        budgetNeeded: sorted[0].price,
      };
    }
    return { candidates: [], top: [], noCandidates: true };
  }

  const scored: ScoredRacket[] = candidates.map(r => ({
    racket: r,
    score: calcScore(axisScoresMap.get(r.id)!, target),
    axisScores: axisScoresMap.get(r.id)!,
  }));

  scored.sort((a, b) => b.score - a.score);

  const top = scored.length > 0 ? [scored[0]] : [];

  return { candidates: scored, top, noCandidates: false };
}
