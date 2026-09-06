# Glossary

Single source of truth for terminology used across `docs/architecture/`. Use the **bolded form** when writing or editing any doc. Add an entry here before introducing a new term.

---

## 1. Domain Concepts

| Term | Definition |
|---|---|
| **IHSG** | Indeks Harga Saham Gabungan — the Indonesian composite stock index. "Whole IHSG" mode in the UI means screening every ticker in `common/constants/idxTickers.json`, not a literal index-membership fetch. |
| **MA Melilit** | "Weaving MAs" — a screener criteria: the 5 dynamic simple moving averages (periods 3/5/10/20/50) sit within a tight percentage band and cross order at least once recently. Detected in `detectMaMelilit` (see [Screener](flows/screener/README.md#the-three-detectors)). |
| **Adam & Eve** | A screener criteria: a rough double-bottom heuristic — two swing lows close in price, separated by a swing high, with the first low sharper than the second. Detected in `detectAdamEve`. |
| **Bullish Divergence** | A screener criteria: price makes a lower low while RSI(14) makes a higher low over the same two swing lows. Detected in `detectBullishDivergence`. |
| **Swing low / swing high** | A local minimum/maximum in the closing-price series over a `±lookback` window (default 3 bars). Computed by `findSwingLowIndices` / `findSwingHighIndices` (`features/screener/utils/swings.ts`). |
| **Confidence** | Per-criteria strength: `low`, `medium`, or `high`. Set independently by each detector based on its own thresholds. |
| **Conviction** | An aggregate score across all of a symbol's matched criteria, computed client/export-side by `computeConviction` (`features/screener/utils/conviction.ts`) — weighted sum of each match's confidence, bucketed into `low`/`medium`/`high`. Distinct from **confidence**, which is per-criteria. |
| **Bandarmology** | Broker-flow / accumulation-distribution analysis. Explicitly **not** implemented in this app (see repo [README.md](../../README.md)) — it requires proprietary Stockbit data. |

## 2. Data Model (cross-cutting)

There is no database. The two shapes that matter are the API contract types in `features/screener/types/index.ts`:

| Type | Notes |
|---|---|
| `OhlcBar` | One daily bar: `date`, `open`, `high`, `low`, `close`, `volume`. Fetched from Yahoo Finance, never persisted. |
| `CriteriaMatch` | `{ criteria, confidence, detail }` — one detector's output for one symbol. |
| `ScreenerResult` | `{ symbol, name, lastClose, matches: CriteriaMatch[] }` — one symbol's full screener outcome. |
| `ScreenerResponse` | `{ results: ScreenerResult[], errors: {symbol, message}[] }` — the full `/api/screener` response shape. |

## 3. Status Values

| Field | Possible values | Where seen |
|---|---|---|
| `CriteriaMatch.criteria` | `ma_melilit`, `adam_eve`, `bullish_divergence` | [Screener](flows/screener/README.md) |
| `CriteriaMatch.confidence` / conviction | `low`, `medium`, `high` | [Screener](flows/screener/README.md) |
| `ColorScheme` | `light`, `dark` | [Shared & Theming](flows/cross-cutting/shared-and-theming/README.md) |

## 4. Architecture Patterns

| Term | Definition |
|---|---|
| **Feature folder** | `features/<name>/{components,composables,constants,types,utils}` — this project's unit of feature isolation, enforced by an ESLint `no-restricted-imports` boundary (see [Testing & Quality](flows/cross-cutting/testing-and-quality/README.md)). Only `features/screener/` exists today. |
| **Common** | `common/` — cross-feature shared code (composables, constants, and currently-empty `components`/`store`/`types`/`utils` placeholders). Not a feature itself. |
| **Composable** | A Vue 3 `use*()` function returning reactive refs, following Vue Composition API convention. This app's composables (`useScreener`, `useColorScheme`) are auto-imported (see [Config & Runtime](flows/cross-cutting/config-and-runtime/README.md)). |
| **Nitro event handler** | Nuxt 4's server route convention — a file under `server/api/` exporting `defineEventHandler`. `server/api/screener.get.ts` is the only one in this app. |

## 5. External Services

> Use the **bolded form** when referencing any of these.

### Third-party SaaS

| Service | Purpose |
|---|---|
| **Yahoo Finance** | Free, unofficial daily OHLCV data source, accessed via the `yahoo-finance2` npm package, ticker format `<SYMBOL>.JK` for IDX-listed stocks. No API key. Can rate-limit or lack data for illiquid tickers (see repo [README.md](../../README.md)). |
| **Stockbit** | Source of the static ticker universe in `common/constants/idxTickers.json` (captured 2026-09-04) — not integrated live, and not the source of any broker-flow/bandarmology data in this app. |

### Naming rules

- **Yahoo Finance** (the data source / npm package `yahoo-finance2`) ≠ any exchange-official IDX data feed — this app uses only the free, unofficial one.
- **Stockbit** here refers only to the one-time ticker-list capture, not a live integration.

## 6. Acronyms

| Acronym | Expansion |
|---|---|
| IDX | Indonesia Stock Exchange |
| IHSG | Indeks Harga Saham Gabungan (Indonesian composite stock index) |
| OHLCV | Open, High, Low, Close, Volume — one bar of price data |
| RSI | Relative Strength Index (momentum oscillator, period 14 in this app) |
| SMA | Simple Moving Average |
