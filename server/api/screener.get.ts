import YahooFinance from "yahoo-finance2";
import { defineEventHandler, getQuery, createError } from "h3";
import type {
  OhlcBar,
  ScreenerResponse,
  ScreenerResult,
} from "../../features/screener/types";
import { detectMaMelilit } from "../../features/screener/utils/detectMaMelilit";
import { detectBullishDivergence } from "../../features/screener/utils/detectBullishDivergence";
import { mergeBullishDivergenceMatches } from "../../features/screener/utils/mergeBullishDivergenceMatches";
import { resampleCloses } from "../../features/screener/utils/resampleCloses";
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
// Calendar days of intraday history to request for the sparkline, wide enough
// to guarantee the latest trading session is included across weekends/holidays.
const SPARKLINE_LOOKBACK_DAYS = 5;
// Jakarta (IDX) has no DST, so a fixed UTC+7 offset is enough to bucket
// intraday quotes by local trading day.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
// Calendar days of 1H history to fetch for the multi-timeframe bullish
// divergence check (also used, resampled, as the 4H series).
const HOURLY_LOOKBACK_DAYS = 90;
// No native 4H interval on the data provider — derive it from four
// consecutive 1H bars.
const FOUR_HOUR_GROUP_SIZE = 4;

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

function jakartaDateKey(date: Date): string {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

function jakartaTimestamp(date: Date): string {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");
}

// 5-minute closes for the most recent trading day, for the row sparkline.
async function fetchIntradaySparkline(symbol: string): Promise<number[]> {
  try {
    const period2 = new Date();
    const period1 = new Date(
      period2.getTime() - SPARKLINE_LOOKBACK_DAYS * MS_PER_DAY,
    );
    const chart = await yahooFinance.chart(toJakartaTicker(symbol), {
      period1,
      period2,
      interval: "5m",
    });

    const quotes = chart.quotes.filter(
      (quote): quote is typeof quote & { close: number } =>
        quote.close !== null,
    );
    if (quotes.length === 0) return [];

    const lastDay = jakartaDateKey(quotes[quotes.length - 1]!.date);
    return quotes
      .filter((quote) => jakartaDateKey(quote.date) === lastDay)
      .map((quote) => quote.close);
  } catch {
    return [];
  }
}

// 1H closes for the last HOURLY_LOOKBACK_DAYS, for the intraday legs of the
// multi-timeframe bullish divergence check (1H directly, 4H via resampling).
async function fetchHourlyCloses(
  symbol: string,
): Promise<{ closes: number[]; dates: string[] }> {
  const period2 = new Date();
  const period1 = new Date(
    period2.getTime() - HOURLY_LOOKBACK_DAYS * MS_PER_DAY,
  );
  const chart = await yahooFinance.chart(toJakartaTicker(symbol), {
    period1,
    period2,
    interval: "1h",
  });

  const quotes = chart.quotes.filter(
    (quote): quote is typeof quote & { close: number } => quote.close !== null,
  );
  return {
    closes: quotes.map((quote) => quote.close),
    dates: quotes.map((quote) => jakartaTimestamp(quote.date)),
  };
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
  data: {
    bars: OhlcBar[];
    sector: string | null;
    sparkline: number[];
    hourly: { closes: number[]; dates: string[] };
  },
  thresholdPct: number,
): ScreenerResult {
  const { bars, sector, sparkline, hourly } = data;
  const closes = bars.map((bar) => bar.close);
  const dates = bars.map((bar) => bar.date);
  const fourHour = resampleCloses(
    hourly.closes,
    hourly.dates,
    FOUR_HOUR_GROUP_SIZE,
  );
  const bullishDivergence = mergeBullishDivergenceMatches([
    detectBullishDivergence(closes, dates, "Daily"),
    detectBullishDivergence(hourly.closes, hourly.dates, "1H"),
    detectBullishDivergence(fourHour.closes, fourHour.dates, "4H"),
  ]);

  const matches = [
    detectMaMelilit(closes, thresholdPct),
    detectAdamEve(closes),
    bullishDivergence,
  ].filter((match): match is NonNullable<typeof match> => match !== null);

  const lastClose = at(closes, closes.length - 1);

  return {
    symbol,
    name: NAME_BY_SYMBOL.get(symbol) ?? symbol,
    sector,
    lastClose,
    prevClose: closes.length > 1 ? at(closes, closes.length - 2) : lastClose,
    matches,
    sparkline,
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
    const [ohlc, sector, sparkline, hourly] = await Promise.all([
      fetchBars(symbol, bars),
      fetchSector(symbol),
      fetchIntradaySparkline(symbol),
      fetchHourlyCloses(symbol),
    ]);
    return {
      result: evaluateSymbol(
        symbol,
        { bars: ohlc, sector, sparkline, hourly },
        thresholdPct,
      ),
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
  const thresholdPct =
    Number(query.thresholdPct) || Number(config.public.maMelilitThresholdPct);

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
