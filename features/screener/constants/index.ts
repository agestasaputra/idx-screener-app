import type { ScreenerCriteria } from "../types";

export const CRITERIA_LABELS: Record<ScreenerCriteria, string> = {
  ma_melilit: "MA Melilit",
  adam_eve: "Adam & Eve",
  bullish_divergence: "Bullish Divergence",
  spike_frequency_analyzer: "Spike Frequency Analyzer",
};

export const CRITERIA_DESCRIPTIONS: Record<ScreenerCriteria, string> = {
  ma_melilit:
    "Dynamic MAs (3/5/10/20/50) tightly bunched and weaving — a consolidation coil that often precedes a breakout.",
  adam_eve:
    "A sharp low (Adam) followed by a rounded low (Eve) at a similar price, with price now testing or just past the neckline breakout.",
  bullish_divergence:
    "Price makes a lower low while RSI makes a higher low, with price still near that low — a reversal setup that hasn't played out yet.",
  spike_frequency_analyzer:
    "Unusual-volume days clustering for the first time in months — a frequency spike often seen right before a breakout.",
};

// Mirrors the "Moving Average Multiple" dynamic set from the user's Stockbit
// Desktop layout (3/5/10/20/50). The static set (100/200/300/400/500/1000)
// is not used by any criteria yet.
export const DYNAMIC_MA_PERIODS = [3, 5, 10, 20, 50] as const;

export const RSI_PERIOD = 14;

// Swing points are local extrema over a +/- window of this many bars.
export const SWING_LOOKBACK = 3;

// Bullish divergence is only an actionable setup while price is still near
// the divergence low. Past this much rally off that low, the uptrend has
// already played out and there's no upside left to catch.
export const BULLISH_DIVERGENCE_MAX_RALLY_PCT = 2;
