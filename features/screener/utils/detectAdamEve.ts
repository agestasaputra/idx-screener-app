import type { CriteriaMatch } from "../types";
import { SWING_LOOKBACK } from "../constants";
import { findSwingLowIndices, findSwingHighIndices } from "./swings";
import { at } from "./arrayAt";

const MAX_BOTTOM_DIFF_PCT = 4;
const SHARPNESS_WINDOW = 2;

// Cheap proxy for "sharp V vs. rounded U": average price change per bar
// immediately around the low. Not a shape classifier — a real one would
// fit a curve to the bottom; this only tells sharper from flatter.
function sharpness(closes: number[], index: number): number {
  const start = Math.max(0, index - SHARPNESS_WINDOW);
  const end = Math.min(closes.length - 1, index + SHARPNESS_WINDOW);
  const bars = end - start || 1;
  return Math.abs(at(closes, end) - at(closes, start)) / bars;
}

export function detectAdamEve(closes: number[]): CriteriaMatch | null {
  const recentLows = findSwingLowIndices(closes, SWING_LOOKBACK).slice(-2);
  const [firstLowIdx, secondLowIdx] = recentLows;
  if (firstLowIdx === undefined || secondLowIdx === undefined) {
    return null;
  }

  const highIndices = findSwingHighIndices(closes, SWING_LOOKBACK);
  const hasPeakBetween = highIndices.some(
    (h) => h > firstLowIdx && h < secondLowIdx,
  );
  if (!hasPeakBetween) {
    return null;
  }

  const firstLowPrice = at(closes, firstLowIdx);
  const secondLowPrice = at(closes, secondLowIdx);
  const diffPct =
    (Math.abs(secondLowPrice - firstLowPrice) / firstLowPrice) * 100;
  if (diffPct > MAX_BOTTOM_DIFF_PCT) {
    return null;
  }

  const firstSharpness = sharpness(closes, firstLowIdx);
  const secondSharpness = sharpness(closes, secondLowIdx);
  const isAdamThenEve = firstSharpness > secondSharpness * 1.3;
  const confidence =
    isAdamThenEve && diffPct < 2 ? "high" : diffPct < 3 ? "medium" : "low";

  return {
    criteria: "adam_eve",
    confidence,
    detail: [
      `Two swing lows ${diffPct.toFixed(2)}% apart with a peak between them${isAdamThenEve ? " (sharp-then-round shape)" : ""}`,
    ],
  };
}
