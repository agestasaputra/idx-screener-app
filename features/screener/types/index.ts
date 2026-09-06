export type Mode = "manual" | "full";

export type ScreenerCriterion =
  "ma_melilit" | "adam_eve" | "bullish_divergence";

export type ConfidenceLevel = "low" | "medium" | "high";

export interface OhlcBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CriterionMatch {
  criterion: ScreenerCriterion;
  confidence: ConfidenceLevel;
  detail: string;
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  sector: string | null;
  lastClose: number;
  matches: CriterionMatch[];
  // 5-minute closes for the most recent trading day, most-recent last — a
  // small intraday preview for a sparkline, separate from the daily history
  // used for criteria detection. May be empty if intraday data is unavailable.
  sparkline: number[];
}

export interface ScreenerResponse {
  results: ScreenerResult[];
  errors: Array<{ symbol: string; message: string }>;
}
