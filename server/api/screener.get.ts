import YahooFinance from "yahoo-finance2";
import { defineEventHandler, getQuery, createError } from "h3";
import type {
  OhlcBar,
  ScreenerResponse,
  ScreenerResult,
} from "../../features/screener/types";
import { detectMaMelilit } from "../../features/screener/utils/detectMaMelilit";
import { detectBullishDivergence } from "../../features/screener/utils/detectBullishDivergence";
import { detectAdamEve } from "../../features/screener/utils/detectAdamEve";
import { at } from "../../features/screener/utils/arrayAt";
import { mapWithConcurrency } from "../../features/screener/utils/concurrency";
import idxTickers from "../../common/constants/idxTickers.json";
import { useRuntimeConfig } from "#imports";

const yahooFinance = new YahooFinance();
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Calendar days needed to cover N trading sessions, padded for weekends/holidays.
const CALENDAR_PADDING = 1.6;
// In-flight Yahoo Finance requests when screening the whole universe.
const FETCH_CONCURRENCY = 10;

const NAME_BY_SYMBOL = new Map(
  idxTickers.map((ticker) => [ticker.symbol, ticker.name]),
);

function parseSymbols(raw: unknown): string[] | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }
  return raw
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

function toJakartaTicker(symbol: string): string {
  return symbol.endsWith(".JK") ? symbol : `${symbol}.JK`;
}

// Sector rarely changes; cache successful lookups across requests to avoid
// re-fetching it for the same symbol on every screen run.
const sectorCache = new Map<string, string | null>();

async function fetchSector(symbol: string): Promise<string | null> {
  const cached = sectorCache.get(symbol);
  if (cached !== undefined) return cached;
  try {
    const summary = await yahooFinance.quoteSummary(toJakartaTicker(symbol), {
      modules: ["assetProfile"],
    });
    const sector = summary.assetProfile?.sector ?? null;
    sectorCache.set(symbol, sector);
    return sector;
  } catch {
    return null;
  }
}

async function fetchBars(symbol: string, bars: number): Promise<OhlcBar[]> {
  const period2 = new Date();
  const period1 = new Date(
    period2.getTime() - bars * MS_PER_DAY * CALENDAR_PADDING,
  );
  const chart = await yahooFinance.chart(toJakartaTicker(symbol), {
    period1,
    period2,
    interval: "1d",
  });

  return chart.quotes
    .filter((quote) => quote.close !== null)
    .map((quote) => ({
      date: quote.date.toISOString().slice(0, 10),
      open: quote.open ?? 0,
      high: quote.high ?? 0,
      low: quote.low ?? 0,
      close: quote.close as number,
      volume: quote.volume ?? 0,
    }));
}

function evaluateSymbol(
  symbol: string,
  data: { bars: OhlcBar[]; sector: string | null },
  thresholdPct: number,
): ScreenerResult {
  const { bars, sector } = data;
  const closes = bars.map((bar) => bar.close);
  const matches = [
    detectMaMelilit(closes, thresholdPct),
    detectAdamEve(closes),
    detectBullishDivergence(closes),
  ].filter((match): match is NonNullable<typeof match> => match !== null);

  return {
    symbol,
    name: NAME_BY_SYMBOL.get(symbol) ?? symbol,
    sector,
    lastClose: at(closes, closes.length - 1),
    matches,
  };
}

async function screenOne(
  symbol: string,
  bars: number,
  thresholdPct: number,
): Promise<{
  result?: ScreenerResult;
  error?: { symbol: string; message: string };
}> {
  try {
    const [ohlc, sector] = await Promise.all([
      fetchBars(symbol, bars),
      fetchSector(symbol),
    ]);
    return {
      result: evaluateSymbol(symbol, { bars: ohlc, sector }, thresholdPct),
    };
  } catch (err) {
    return {
      error: {
        symbol,
        message: err instanceof Error ? err.message : "Unknown error",
      },
    };
  }
}

export default defineEventHandler(async (event): Promise<ScreenerResponse> => {
  const query = getQuery(event);
  const requested = parseSymbols(query.symbols);
  const limit = Number(query.limit) || undefined;
  const universe = requested ?? idxTickers.map((ticker) => ticker.symbol);
  const symbols = limit ? universe.slice(0, limit) : universe;

  if (symbols.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No symbols to screen.",
    });
  }

  const config = useRuntimeConfig();
  const bars = Number(query.bars) || Number(config.public.defaultBars);
  const thresholdPct = Number(config.public.maMelilitThresholdPct);

  const outcomes = await mapWithConcurrency(
    symbols,
    FETCH_CONCURRENCY,
    (symbol) => screenOne(symbol, bars, thresholdPct),
  );

  const results = outcomes
    .map((o) => o.result)
    .filter((r): r is ScreenerResult => r !== undefined);
  const errors = outcomes
    .map((o) => o.error)
    .filter((e): e is { symbol: string; message: string } => e !== undefined);

  return { results, errors };
});
