import { SMA } from "technicalindicators";

// Named properties (not a Record index signature) so TypeScript's
// noUncheckedIndexedAccess doesn't add `| undefined` to a lookup we already
// know is safe: every one of the 5 dynamic periods is always built below.
export interface MaSeriesByPeriod {
  3: Array<number | undefined>;
  5: Array<number | undefined>;
  10: Array<number | undefined>;
  20: Array<number | undefined>;
  50: Array<number | undefined>;
}

// Left-pads an SMA(period) output so index k lines up with closes[k],
// instead of technicalindicators' own 0-based, period-shorter array.
function alignToCloses(
  series: number[],
  period: number,
  length: number,
): Array<number | undefined> {
  const offset = period - 1;
  return Array.from({ length }, (_, i) => series[i - offset]);
}

function seriesFor(
  closes: number[],
  period: number,
): Array<number | undefined> {
  return alignToCloses(
    SMA.calculate({ period, values: closes }),
    period,
    closes.length,
  );
}

export function buildDynamicMaSeries(closes: number[]): MaSeriesByPeriod {
  return {
    3: seriesFor(closes, 3),
    5: seriesFor(closes, 5),
    10: seriesFor(closes, 10),
    20: seriesFor(closes, 20),
    50: seriesFor(closes, 50),
  };
}
