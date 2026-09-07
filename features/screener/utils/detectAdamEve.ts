import type { CriteriaMatch, ConfidenceLevel } from "../types";
import { SWING_LOOKBACK } from "../constants";
import { findSwingLowIndices, findSwingHighIndices } from "./swings";
import { at } from "./arrayAt";

const MAX_BOTTOM_DIFF_PCT = 4;
const SHARPNESS_WINDOW = 2;
// How far below the neckline (the peak between Adam and Eve) still counts as
// testing resistance rather than an unrelated, unbroken base.
const NECKLINE_BAND_BELOW_PCT = 5;
// Past this much above the neckline, the breakout has already run too far —
// same reasoning as the bullish divergence rally cap: the entry is gone.
const MAX_BREAKOUT_RALLY_PCT = 1;
// Detection runs on the daily bars fetched in screener.get.ts.
const TIMEFRAME = "Daily (1D)";

// Cheap proxy for "sharp V vs. rounded U": average price change per bar
// immediately around the low. Not a shape classifier — a real one would
// fit a curve to the bottom; this only tells sharper from flatter.
function sharpness(closes: number[], index: number): number {
  const start = Math.max(0, index - SHARPNESS_WINDOW);
  const end = Math.min(closes.length - 1, index + SHARPNESS_WINDOW);
  const bars = end - start || 1;
  return Math.abs(at(closes, end) - at(closes, start)) / bars;
}

function findBottoms(
  closes: number[],
): { firstLowIdx: number; secondLowIdx: number; diffPct: number } | null {
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

  return { firstLowIdx, secondLowIdx, diffPct };
}

// Only actionable while price is still near the neckline — testing it
// pre-breakout, or just past it. Too far below and there's no breakout to
// catch yet; too far above and the move it predicted has already played
// out, same as the last-close guard on bullish divergence.
function resolveNeckline(
  closes: number[],
  firstLowIdx: number,
  secondLowIdx: number,
): { necklinePrice: number; lastClose: number; hasBrokenOut: boolean } | null {
  const necklinePrice = Math.max(
    ...closes.slice(firstLowIdx, secondLowIdx + 1),
  );
  const lastClose = at(closes, closes.length - 1);
  const distanceFromNecklinePct =
    ((lastClose - necklinePrice) / necklinePrice) * 100;
  if (
    distanceFromNecklinePct < -NECKLINE_BAND_BELOW_PCT ||
    distanceFromNecklinePct > MAX_BREAKOUT_RALLY_PCT
  ) {
    return null;
  }

  return { necklinePrice, lastClose, hasBrokenOut: lastClose > necklinePrice };
}

function buildDetail(input: {
  diffPct: number;
  isAdamThenEve: boolean;
  necklinePrice: number;
  lastClose: number;
  hasBrokenOut: boolean;
  dates: { first: string; second: string; last: string };
}): string[] {
  const {
    diffPct,
    isAdamThenEve,
    necklinePrice,
    lastClose,
    hasBrokenOut,
    dates,
  } = input;
  return [
    `Timeframe: ${TIMEFRAME}`,
    `Two swing lows ${diffPct.toFixed(2)}% apart (${dates.first} to ${dates.second}) with a peak (neckline) between them${isAdamThenEve ? " (sharp-then-round shape)" : ""}`,
    `Neckline ${necklinePrice.toFixed(0)}, last close ${lastClose.toFixed(0)} (${hasBrokenOut ? "broken out" : "testing resistance"})`,
    `Check chart: ${dates.first} to ${dates.last}`,
  ];
}

export function detectAdamEve(
  closes: number[],
  dates: string[],
): CriteriaMatch | null {
  const bottoms = findBottoms(closes);
  if (bottoms === null) {
    return null;
  }
  const { firstLowIdx, secondLowIdx, diffPct } = bottoms;

  const neckline = resolveNeckline(closes, firstLowIdx, secondLowIdx);
  if (neckline === null) {
    return null;
  }
  const { necklinePrice, lastClose, hasBrokenOut } = neckline;

  const firstSharpness = sharpness(closes, firstLowIdx);
  const secondSharpness = sharpness(closes, secondLowIdx);
  const isAdamThenEve = firstSharpness > secondSharpness * 1.3;
  const confidence: ConfidenceLevel =
    isAdamThenEve && diffPct < 2 && hasBrokenOut
      ? "high"
      : diffPct < 3
        ? "medium"
        : "low";

  return {
    criteria: "adam_eve",
    confidence,
    detail: buildDetail({
      diffPct,
      isAdamThenEve,
      necklinePrice,
      lastClose,
      hasBrokenOut,
      dates: {
        first: at(dates, firstLowIdx),
        second: at(dates, secondLowIdx),
        last: at(dates, dates.length - 1),
      },
    }),
  };
}
