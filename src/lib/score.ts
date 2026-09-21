import type { RacketSpec, AxisScores, Target, ScoredRacket, RankedRacket, HardFilter } from './types';
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
  top: RankedRacket[];
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

  const top = diversify(scored);

  return { candidates: scored, top, noCandidates: false };
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
  const second = isEasier ? rank2pool[0] : differentFrom1[0];
  result.push({ ...second, role: isEasier ? 'easier' : 'alternative' });

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
  const third = isAggressive ? rank3pool[0] : differentFrom1and2[0];
  result.push({ ...third, role: isAggressive ? 'aggressive' : 'alternative' });

  return result;
}
