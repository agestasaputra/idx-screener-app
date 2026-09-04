import type { ScreenerCriterion } from "../types";

export const CRITERION_LABELS: Record<ScreenerCriterion, string> = {
  ma_melilit: "MA Melilit",
  adam_eve: "Adam & Eve",
  bullish_divergence: "Bullish Divergence",
};

// Mirrors the "Moving Average Multiple" dynamic set from the user's Stockbit
// Desktop layout (3/5/10/20/50). The static set (100/200/300/400/500/1000)
// is not used by any criterion yet.
export const DYNAMIC_MA_PERIODS = [3, 5, 10, 20, 50] as const;

export const RSI_PERIOD = 14;

// Swing points are local extrema over a +/- window of this many bars.
export const SWING_LOOKBACK = 3;
