export type RacketSpec = {
  id: string;
  brand: string;
  series: string;
  model: string;
  year: number;
  weight: number;
  balance: number;
  swingWeight: number;
  headSize: number;
  ra: number;
  beamWidth: number;
  pattern: '16x19' | '16x20' | '18x20' | 'other';
  /** 参考価格。診断では使わない（価格は楽天の商品ページで見てもらう） */
  price: number;
  imageUrl: string;
  affiliateUrl: {
    rakuten: string;
    amazon: string;
  };
  overrides?: Partial<AxisScores>;
};

export const AXES = ['power', 'control', 'spin', 'maneuverability', 'comfort', 'volley'] as const;
export type Axis = typeof AXES[number];

export type AxisScores = {
  power: number;
  control: number;
  spin: number;
  maneuverability: number;
  comfort: number;
  volley: number;
};

export type HardFilter =
  | { type: 'weight_max'; value: number }
  | { type: 'weight_min'; value: number }
  | { type: 'weight_range'; min: number; max: number }
  | { type: 'ra_max'; value: number }
  | { type: 'beamWidth_max'; value: number }
  | { type: 'pattern_exclude'; value: string }
  | { type: 'brand'; values: string[] };

export type Target = {
  ideal: AxisScores;
  weight: Record<Axis, number>;
  filters: HardFilter[];
};

export type Level = 'beginner' | 'beginnerIntermediate' | 'intermediate' | 'advanced';
export type PlayStyle = 'baseline' | 'allround' | 'net';
export type SwingSize = 'compact' | 'standard' | 'full';
export type Problem = 'noPower' | 'tooMuchPower' | 'noSpin' | 'lateBall' | 'armPain';
export type ElbowCondition = 'none' | 'sometimes' | 'painful';
export type CurrentWeight = 'under275' | '275to290' | '290to305' | 'over305' | 'unknown';
export type StringType = 'poly' | 'nylon' | 'unknown';

export type Answers = {
  q1: Level;
  q2: PlayStyle;
  q3: SwingSize;
  q4: Problem[];
  q5: ElbowCondition;
  q6: CurrentWeight;
  q7: StringType;
  // q8（予算）は廃止。シェアURLの互換のため、8番目の枠だけ share.ts が予約している
  q9: string[]; // ブランドフィルタ（空配列 = こだわらない）
};

export type ScoredRacket = {
  racket: RacketSpec;
  score: number;
  axisScores: AxisScores;
};

export type RacketRole = 'best' | 'easier' | 'aggressive' | 'alternative';

export type RankedRacket = ScoredRacket & {
  role: RacketRole;
};

export type DiagnosisResult = {
  candidates: ScoredRacket[];
  top: ScoredRacket[];
  target: Target;
};
