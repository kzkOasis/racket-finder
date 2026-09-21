import type { RacketSpec, AxisScores } from './types';
import { PATTERN_CONTROL_BONUS, PATTERN_SPIN_BONUS } from './constants';

function norm(value: number, all: number[]): number {
  const min = Math.min(...all);
  const max = Math.max(...all);
  return max === min ? 50 : ((value - min) / (max - min)) * 100;
}


export function computeAxisScores(rackets: RacketSpec[]): Map<string, AxisScores> {
  const allSwingWeight = rackets.map(r => r.swingWeight);
  const allHeadSize   = rackets.map(r => r.headSize);
  const allRa         = rackets.map(r => r.ra);
  const allBeamWidth  = rackets.map(r => r.beamWidth);
  const allWeight     = rackets.map(r => r.weight);
  const allBalance    = rackets.map(r => r.balance);

  const result = new Map<string, AxisScores>();

  for (const r of rackets) {
    const nSwingWeight = norm(r.swingWeight, allSwingWeight);
    const nHeadSize    = norm(r.headSize, allHeadSize);
    const nRa          = norm(r.ra, allRa);
    const nBeamWidth   = norm(r.beamWidth, allBeamWidth);
    const nWeight      = norm(r.weight, allWeight);
    const nBalance     = norm(r.balance, allBalance);

    const iSwingWeight = 100 - nSwingWeight;
    const iHeadSize    = 100 - nHeadSize;
    const iRa          = 100 - nRa;
    const iBeamWidth   = 100 - nBeamWidth;
    const iWeight      = 100 - nWeight;
    const iBalance     = 100 - nBalance;

    const controlBonus = PATTERN_CONTROL_BONUS[r.pattern] ?? PATTERN_CONTROL_BONUS['other'];
    const spinBonus    = PATTERN_SPIN_BONUS[r.pattern]    ?? PATTERN_SPIN_BONUS['other'];

    const power           = 0.35 * nSwingWeight + 0.25 * nHeadSize + 0.25 * nRa + 0.15 * nBeamWidth;
    const control         = 0.35 * iHeadSize    + 0.30 * iRa       + 0.20 * controlBonus + 0.15 * iBeamWidth;
    const spin            = 0.40 * spinBonus    + 0.30 * nHeadSize  + 0.30 * nSwingWeight;
    const maneuverability = 0.45 * iWeight      + 0.40 * iSwingWeight + 0.15 * iBalance;
    const volley_raw      = 0.35 * iBalance     + 0.35 * maneuverability + 0.30 * nWeight;

    // comfort と volley は maneuverability が必要なので順番注意
    const comfort = 0.45 * iRa + 0.30 * iBeamWidth + 0.25 * nWeight;
    const volley  = volley_raw;

    const computed: AxisScores = {
      power:           Math.round(power * 10) / 10,
      control:         Math.round(control * 10) / 10,
      spin:            Math.round(spin * 10) / 10,
      maneuverability: Math.round(maneuverability * 10) / 10,
      comfort:         Math.round(comfort * 10) / 10,
      volley:          Math.round(volley * 10) / 10,
    };

    // overrides を適用
    const scores: AxisScores = r.overrides
      ? { ...computed, ...r.overrides }
      : computed;

    result.set(r.id, scores);
  }

  return result;
}
