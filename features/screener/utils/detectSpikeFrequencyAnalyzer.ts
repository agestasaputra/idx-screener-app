import type { ConfidenceLevel, CriteriaMatch, OhlcBar } from "../types";
import { SWING_LOOKBACK } from "../constants";
import { findSwingLowIndices } from "./swings";
import { at } from "./arrayAt";

// A day's volume must exceed this multiple of its own trailing baseline to
// count as "unusual activity".
const VOLUME_BASELINE_WINDOW = 20;
const SPIKE_VOLUME_MULTIPLE = 2;
// "Frequency" is a rolling count of unusual-activity days within this many
// trailing bars — this count is what spikes right before a breakout.
const FREQUENCY_WINDOW = 10;
const FREQUENCY_SPIKE_THRESHOLD = 3;
const RECENT_BARS_WINDOW = 10;
// Only actionable while price is still near where the spike happened — same
// "hasn't rallied away yet" guard used by bullish divergence and Adam & Eve.
const MAX_RALLY_FROM_SPIKE_PCT = 1;
const TIMEFRAME = "Daily (1D)";

function unusualVolumeFlags(bars: OhlcBar[]): boolean[] {
  return bars.map((bar, i) => {
    if (i < VOLUME_BASELINE_WINDOW) {
      return false;
    }
    const window = bars.slice(i - VOLUME_BASELINE_WINDOW, i);
    const baseline =
      window.reduce((sum, b) => sum + b.volume, 0) / window.length;
    return baseline > 0 && bar.volume > baseline * SPIKE_VOLUME_MULTIPLE;
  });
}

function frequencySeries(flags: boolean[]): number[] {
  return flags.map((_, i) => {
    const start = Math.max(0, i - FREQUENCY_WINDOW + 1);
    return flags.slice(start, i + 1).filter(Boolean).length;
  });
}

// The most recent Lower Low — a swing low that undercut the swing low before
// it — marks where the ticker's current price structure began. Comparing
// against everything since that point (rather than a fixed bar count) is the
// maximum honest lookback: further back belongs to a different structure.
function findLastLowerLowIndex(closes: number[]): number | null {
  const recentLows = findSwingLowIndices(closes, SWING_LOOKBACK).slice(-2);
  const [firstLowIdx, secondLowIdx] = recentLows;
  if (firstLowIdx === undefined || secondLowIdx === undefined) {
    return null;
  }
  return at(closes, secondLowIdx) < at(closes, firstLowIdx)
    ? secondLowIdx
    : null;
}

// Walks backward from the most recent bar to find the latest point where the
// frequency crossed above the spike threshold for the first time since
// baselineStart.
function findSpikeIndex(freq: number[], baselineStart: number): number | null {
  for (let i = freq.length - 1; i >= FREQUENCY_WINDOW; i -= 1) {
    const current = at(freq, i);
    const previous = at(freq, i - 1);
    const justCrossed =
      current >= FREQUENCY_SPIKE_THRESHOLD &&
      previous < FREQUENCY_SPIKE_THRESHOLD;
    if (!justCrossed) {
      continue;
    }
    const baselineEnd = Math.max(baselineStart, i - FREQUENCY_WINDOW);
    const priorMax = Math.max(
      0,
      ...freq.slice(Math.min(baselineStart, baselineEnd), baselineEnd),
    );
    if (priorMax < FREQUENCY_SPIKE_THRESHOLD) {
      return i;
    }
  }
  return null;
}

function buildDetail(input: {
  spikeFreq: number;
  baselineDate: string;
  spikeDate: string;
  spikePrice: number;
  lastClose: number;
  lastDate: string;
}): string[] {
  const {
    spikeFreq,
    baselineDate,
    spikeDate,
    spikePrice,
    lastClose,
    lastDate,
  } = input;
  return [
    `Timeframe: ${TIMEFRAME}`,
    `Unusual volume ${spikeFreq}/${FREQUENCY_WINDOW} bars (>${SPIKE_VOLUME_MULTIPLE}x avg volume) — first spike since the last Lower Low (${baselineDate})`,
    `Spike on ${spikeDate} at ${spikePrice.toFixed(0)}, last close ${lastClose.toFixed(0)}`,
    `Check chart: ${spikeDate} to ${lastDate}`,
  ];
}

export function detectSpikeFrequencyAnalyzer(
  bars: OhlcBar[],
): CriteriaMatch | null {
  if (bars.length < VOLUME_BASELINE_WINDOW + FREQUENCY_WINDOW) {
    return null;
  }

  const closes = bars.map((bar) => bar.close);
  const baselineStart = findLastLowerLowIndex(closes) ?? 0;
  const freq = frequencySeries(unusualVolumeFlags(bars));
  const spikeIdx = findSpikeIndex(freq, baselineStart);
  if (spikeIdx === null) {
    return null;
  }

  const spikePrice = at(closes, spikeIdx);
  const lastClose = at(closes, closes.length - 1);
  const rallyFromSpikePct = ((lastClose - spikePrice) / spikePrice) * 100;
  if (rallyFromSpikePct > MAX_RALLY_FROM_SPIKE_PCT) {
    return null;
  }

  const spikeFreq = at(freq, spikeIdx);
  const isRecent = spikeIdx >= closes.length - RECENT_BARS_WINDOW;
  const confidence: ConfidenceLevel =
    isRecent && spikeFreq >= FREQUENCY_SPIKE_THRESHOLD + 2
      ? "high"
      : spikeFreq >= FREQUENCY_SPIKE_THRESHOLD + 1
        ? "medium"
        : "low";

  return {
    criteria: "spike_frequency_analyzer",
    confidence,
    detail: buildDetail({
      spikeFreq,
      baselineDate: at(bars, baselineStart).date,
      spikeDate: at(bars, spikeIdx).date,
      spikePrice,
      lastClose,
      lastDate: at(bars, bars.length - 1).date,
    }),
  };
}
