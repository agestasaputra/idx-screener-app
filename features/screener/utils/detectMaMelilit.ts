import type { CriteriaMatch } from "../types";
import { DYNAMIC_MA_PERIODS } from "../constants";
import { buildDynamicMaSeries } from "./maSeries";
import { at } from "./arrayAt";

const WEAVE_WINDOW = 10;

function dispersionPct(values: number[]): number {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return ((max - min) / mean) * 100;
}

// Counts how many times any two of the dynamic MAs swap relative order
// across the window — the numeric signature of lines "weaving" on a chart.
function countOrderFlips(seriesByPeriod: number[][]): number {
  const first = seriesByPeriod[0];
  if (!first) {
    return 0;
  }
  let flips = 0;
  for (let i = 1; i < first.length; i += 1) {
    for (let a = 0; a < seriesByPeriod.length - 1; a += 1) {
      const seriesA = seriesByPeriod[a];
      const seriesB = seriesByPeriod[a + 1];
      if (!seriesA || !seriesB) continue;
      const prevDiff = at(seriesA, i - 1) - at(seriesB, i - 1);
      const currDiff = at(seriesA, i) - at(seriesB, i);
      if (Math.sign(prevDiff) !== Math.sign(currDiff)) {
        flips += 1;
      }
    }
  }
  return flips;
}

export function detectMaMelilit(
  closes: number[],
  thresholdPct: number,
): CriteriaMatch | null {
  const aligned = buildDynamicMaSeries(closes);
  const lastIndex = closes.length - 1;
  const latest = [
    aligned[3][lastIndex],
    aligned[5][lastIndex],
    aligned[10][lastIndex],
    aligned[20][lastIndex],
    aligned[50][lastIndex],
  ];
  if (latest.includes(undefined)) {
    return null;
  }

  const values = latest as number[];
  const spreadPct = dispersionPct(values);
  if (spreadPct > thresholdPct) {
    return null;
  }

  const windowStart = Math.max(0, closes.length - WEAVE_WINDOW);
  const windowSeries = DYNAMIC_MA_PERIODS.map(
    (period) => aligned[period].slice(windowStart) as number[],
  );
  const flips = countOrderFlips(windowSeries);
  const confidence =
    flips > 0 ? "high" : spreadPct < thresholdPct / 2 ? "medium" : "low";

  return {
    criteria: "ma_melilit",
    confidence,
    detail: [
      `MA3/5/10/20/50 spread ${spreadPct.toFixed(2)}% (threshold ${thresholdPct}%)`,
      `${flips} crossover(s) in the last ${WEAVE_WINDOW} bars`,
    ],
  };
}
