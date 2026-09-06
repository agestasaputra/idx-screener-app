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
}

export interface ScreenerResponse {
  results: ScreenerResult[];
  errors: Array<{ symbol: string; message: string }>;
}
