import { RSI } from "technicalindicators";
import type { CriterionMatch } from "../types";
import { RSI_PERIOD, SWING_LOOKBACK } from "../constants";
import { findSwingLowIndices } from "./swings";
import { at } from "./arrayAt";

const RECENT_BARS_WINDOW = 10;

export function detectBullishDivergence(
  closes: number[],
): CriterionMatch | null {
  const rsiSeries = RSI.calculate({ period: RSI_PERIOD, values: closes });
  const rsiOffset = closes.length - rsiSeries.length;
  const recentLows = findSwingLowIndices(closes, SWING_LOOKBACK).slice(-2);
  const [firstLowIdx, secondLowIdx] = recentLows;
  if (firstLowIdx === undefined || secondLowIdx === undefined) {
    return null;
  }

  const firstRsiIdx = firstLowIdx - rsiOffset;
  const secondRsiIdx = secondLowIdx - rsiOffset;
  if (firstRsiIdx < 0 || secondRsiIdx < 0) {
    return null;
  }

  const firstPrice = at(closes, firstLowIdx);
  const secondPrice = at(closes, secondLowIdx);
  const firstRsi = at(rsiSeries, firstRsiIdx);
  const secondRsi = at(rsiSeries, secondRsiIdx);
  if (!(secondPrice < firstPrice) || !(secondRsi > firstRsi)) {
    return null;
  }

  const rsiGap = secondRsi - firstRsi;
  const isRecent = secondLowIdx >= closes.length - RECENT_BARS_WINDOW;
  const confidence =
    isRecent && rsiGap > 5 ? "high" : rsiGap > 2 ? "medium" : "low";

  return {
    criterion: "bullish_divergence",
    confidence,
    detail: `Price lower low (${firstPrice.toFixed(0)} -> ${secondPrice.toFixed(0)}), RSI higher low (${firstRsi.toFixed(1)} -> ${secondRsi.toFixed(1)})`,
  };
}
