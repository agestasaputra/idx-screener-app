# IDX Screener App

A personal IDX (Indonesia Stock Exchange) screener. Fetches free daily OHLCV
data from Yahoo Finance (`<TICKER>.JK`) and screens for three chart criteria:

- **MA Melilit** — the dynamic MAs (MA3/5/10/20/50) sit within a tight
  percentage band and cross order at least once recently ("weaving").
- **Adam & Eve** — a rough double-bottom heuristic: two swing lows close in
  price, separated by a peak, with the first sharper than the second.
- **Bullish Divergence** — price makes a lower low while RSI(14) makes a
  higher low over the same two swings.

All three are heuristics over free market data, not validated signals — read
`detail` on each match and use your own judgment.

## Toolchain

Mirrors the conventions of `hub-chat` (pnpm, strict ESLint + Prettier, Vitest,
Husky + lint-staged, `common/` + `features/<name>/` structure) without its
product-specific dependencies (no Ably/Firebase/MOEngage/Datadog/CI configs).

- Node 22 (`.nvmrc`), pnpm 10 (`packageManager` field)
- Nuxt 4, TypeScript (strict, `noUncheckedIndexedAccess`)
- ESLint (`@nuxtjs/eslint-config-typescript` + Prettier), complexity/size caps
- Vitest + `@nuxt/test-utils` + `@testing-library/vue`
- Husky pre-commit: `lint-staged` → `type-check` → `test:related`

## Structure

```
app/                    # Nuxt 4 srcDir: pages/, layouts/, app.vue
common/                 # Cross-feature components/composables/utils/store
configs/                # Per-environment public config (APP_STAGE-selected)
features/screener/      # The screener feature: types, constants, utils, composables
server/api/screener.get.ts   # Fetches Yahoo Finance data, runs the 3 detectors
```

## Setup

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000/screener, enter comma-separated tickers
(e.g. `BBRI,BBCA,TLKM`, no `.JK` needed), and run the screener.

## Scripts

```bash
pnpm lint         # eslint + prettier check
pnpm lint:fix     # auto-fix both
pnpm type-check   # vue-tsc --noEmit
pnpm test         # vitest
```

## Known limitations

- Yahoo Finance's `.JK` coverage is unofficial/scraping-based — it can break,
  rate-limit, or lack data for illiquid tickers.
- No broker-flow (bandarmology) data here — that's proprietary to Stockbit.
  If you want to add it later, the existing `stockbit-mcp` setup (see the
  sibling `sb-mcp` project) is the source for that specific signal.
- Thresholds (`configs/*.json`) are untuned starting points — adjust
  `maMelilitThresholdPct` and the detector constants in
  `features/screener/constants/index.ts` as you validate results.
