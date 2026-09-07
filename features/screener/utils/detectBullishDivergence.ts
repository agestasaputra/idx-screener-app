import { RSI } from "technicalindicators";
import type { CriteriaMatch } from "../types";
import {
  BULLISH_DIVERGENCE_MAX_RALLY_PCT,
  RSI_PERIOD,
  SWING_LOOKBACK,
} from "../constants";
import { findSwingLowIndices } from "./swings";
import { at } from "./arrayAt";

const RECENT_BARS_WINDOW = 10;

function buildDetail(input: {
  timeframe: string;
  prices: { first: number; second: number };
  rsis: { first: number; second: number };
  dates: { first: string; second: string; last: string };
}): string[] {
  const { timeframe, prices, rsis, dates } = input;
  return [
    `Timeframe: ${timeframe}`,
    `Price lower low: ${prices.first.toFixed(0)} -> ${prices.second.toFixed(0)} (${dates.first} to ${dates.second})`,
    `RSI higher low: ${rsis.first.toFixed(1)} -> ${rsis.second.toFixed(1)}`,
    `Check chart: ${dates.first} to ${dates.last}`,
  ];
}

function findDivergenceIndices(
  closes: number[],
  rsiOffset: number,
): {
  firstLowIdx: number;
  secondLowIdx: number;
  firstRsiIdx: number;
  secondRsiIdx: number;
} | null {
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

  return { firstLowIdx, secondLowIdx, firstRsiIdx, secondRsiIdx };
}

export function detectBullishDivergence(
  closes: number[],
  dates: string[],
  timeframe: string,
): CriteriaMatch | null {
  const rsiSeries = RSI.calculate({ period: RSI_PERIOD, values: closes });
  const rsiOffset = closes.length - rsiSeries.length;
  const indices = findDivergenceIndices(closes, rsiOffset);
  if (indices === null) {
    return null;
  }
  const { firstLowIdx, secondLowIdx, firstRsiIdx, secondRsiIdx } = indices;

  const firstPrice = at(closes, firstLowIdx);
  const secondPrice = at(closes, secondLowIdx);
  const firstRsi = at(rsiSeries, firstRsiIdx);
  const secondRsi = at(rsiSeries, secondRsiIdx);
  if (!(secondPrice < firstPrice) || !(secondRsi > firstRsi)) {
    return null;
  }

  // Only actionable while price is still near the divergence low — once it
  // has rallied past this, the uptrend the divergence predicted has already
  // happened and there's no higher price left to take profit at.
  const lastClose = at(closes, closes.length - 1);
  const rallyFromLowPct = ((lastClose - secondPrice) / secondPrice) * 100;
  if (rallyFromLowPct > BULLISH_DIVERGENCE_MAX_RALLY_PCT) {
    return null;
  }

  const rsiGap = secondRsi - firstRsi;
  const isRecent = secondLowIdx >= closes.length - RECENT_BARS_WINDOW;
  const confidence =
    isRecent && rsiGap > 5 ? "high" : rsiGap > 2 ? "medium" : "low";

  const detail = buildDetail({
    timeframe,
    prices: { first: firstPrice, second: secondPrice },
    rsis: { first: firstRsi, second: secondRsi },
    dates: {
      first: at(dates, firstLowIdx),
      second: at(dates, secondLowIdx),
      last: at(dates, dates.length - 1),
    },
  });

  return { criteria: "bullish_divergence", confidence, detail };
}
