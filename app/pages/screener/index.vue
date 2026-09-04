<script setup lang="ts">
import { ref, computed } from "vue";
import { useScreener } from "~~/features/screener/composables/useScreener";
import { CRITERION_LABELS } from "~~/features/screener/constants";
import type {
  ConfidenceLevel,
  ScreenerCriterion,
  ScreenerResult,
} from "~~/features/screener/types";
import {
  computeConviction,
  type ConvictionLevel,
} from "~~/features/screener/utils/conviction";
import { downloadResults } from "~~/features/screener/utils/exportResults";
import idxTickers from "~~/common/constants/idxTickers.json";

type Mode = "manual" | "full";

const mode = ref<Mode>("manual");
const symbolsInput = ref("BBRI,BBCA,TLKM,ASII,BMRI");
const { isLoading, response, error, run } = useScreener();

const universeSize = idxTickers.length;

const CRITERIA_OPTIONS = Object.keys(CRITERION_LABELS) as ScreenerCriterion[];
const CONFIDENCE_OPTIONS: ConfidenceLevel[] = ["high", "medium", "low"];
const CONVICTION_OPTIONS: ConvictionLevel[] = ["high", "medium", "low"];

const matchedResults = computed(
  () => response.value?.results.filter((r) => r.matches.length > 0) ?? [],
);

// Column filters
const symbolQuery = ref("");
const minClose = ref<number | null>(null);
const maxClose = ref<number | null>(null);
const activeCriteria = ref<ScreenerCriterion[]>([]);
const activeConfidence = ref<ConfidenceLevel[]>([]);
const activeConviction = ref<ConvictionLevel[]>([]);

function toggle<T>(list: T[], value: T): void {
  const idx = list.indexOf(value);
  if (idx === -1) {
    list.push(value);
  } else {
    list.splice(idx, 1);
  }
}

const toggleCriterion = (criterion: ScreenerCriterion): void =>
  toggle(activeCriteria.value, criterion);
const toggleConfidence = (level: ConfidenceLevel): void =>
  toggle(activeConfidence.value, level);
const toggleConviction = (level: ConvictionLevel): void =>
  toggle(activeConviction.value, level);

const isCloseFilterActive = computed(
  () => minClose.value !== null || maxClose.value !== null,
);
const criteriaFilterCount = computed(
  () => activeCriteria.value.length + activeConfidence.value.length,
);

const hasActiveFilters = computed(
  () =>
    symbolQuery.value.trim().length > 0 ||
    minClose.value !== null ||
    maxClose.value !== null ||
    activeCriteria.value.length > 0 ||
    activeConfidence.value.length > 0 ||
    activeConviction.value.length > 0,
);

function clearFilters(): void {
  symbolQuery.value = "";
  minClose.value = null;
  maxClose.value = null;
  activeCriteria.value = [];
  activeConfidence.value = [];
  activeConviction.value = [];
}

function matchesSearch(result: ScreenerResult, query: string): boolean {
  if (!query) return true;
  return (
    result.symbol.toLowerCase().includes(query) ||
    result.name.toLowerCase().includes(query)
  );
}

function matchesCloseRange(result: ScreenerResult): boolean {
  if (minClose.value !== null && result.lastClose < minClose.value)
    return false;
  if (maxClose.value !== null && result.lastClose > maxClose.value)
    return false;
  return true;
}

function matchesCriteria(result: ScreenerResult): boolean {
  if (activeCriteria.value.length === 0) return true;
  return result.matches.some((m) => activeCriteria.value.includes(m.criterion));
}

function matchesConfidence(result: ScreenerResult): boolean {
  if (activeConfidence.value.length === 0) return true;
  return result.matches.some((m) =>
    activeConfidence.value.includes(m.confidence),
  );
}

function matchesConviction(result: ScreenerResult): boolean {
  if (activeConviction.value.length === 0) return true;
  return activeConviction.value.includes(computeConviction(result.matches));
}

const filteredResults = computed(() => {
  const query = symbolQuery.value.trim().toLowerCase();
  return matchedResults.value.filter(
    (result) =>
      matchesSearch(result, query) &&
      matchesCloseRange(result) &&
      matchesCriteria(result) &&
      matchesConfidence(result) &&
      matchesConviction(result),
  );
});

type SortColumn = "symbol" | "lastClose" | "conviction" | "matches";
type SortDirection = "asc" | "desc";

const CONVICTION_RANK: Record<ConvictionLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const sortColumn = ref<SortColumn | null>(null);
const sortDirection = ref<SortDirection>("asc");

function toggleSort(column: SortColumn): void {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortDirection.value = "asc";
  }
}

function compareResults(
  a: ScreenerResult,
  b: ScreenerResult,
  column: SortColumn,
): number {
  switch (column) {
    case "symbol":
      return a.symbol.localeCompare(b.symbol);
    case "lastClose":
      return a.lastClose - b.lastClose;
    case "conviction":
      return (
        CONVICTION_RANK[computeConviction(a.matches)] -
        CONVICTION_RANK[computeConviction(b.matches)]
      );
    case "matches":
      return a.matches.length - b.matches.length;
  }
}

const sortedResults = computed(() => {
  const column = sortColumn.value;
  if (!column) return filteredResults.value;
  const sign = sortDirection.value === "asc" ? 1 : -1;
  return [...filteredResults.value].sort(
    (a, b) => sign * compareResults(a, b, column),
  );
});

function parseSymbols(raw: string): string[] {
  return raw
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

async function onRun(): Promise<void> {
  clearFilters();
  if (mode.value === "full") {
    await run({});
    return;
  }
  const symbols = parseSymbols(symbolsInput.value);
  if (symbols.length > 0) {
    await run({ symbols });
  }
}
</script>

<template>
  <section class="screener">
    <p class="hint">
      Checks MA Melilit, Adam &amp; Eve and Bullish Divergence from free Yahoo
      Finance daily data — a heuristic screen, not a verified signal.
    </p>

    <div class="card controls">
      <div class="mode-toggle">
        <label
          class="mode-option"
          :class="{ 'mode-option--active': mode === 'manual' }"
        >
          <input v-model="mode" type="radio" value="manual" />
          Manual tickers
        </label>
        <label
          class="mode-option"
          :class="{ 'mode-option--active': mode === 'full' }"
        >
          <input v-model="mode" type="radio" value="full" />
          Whole IHSG ({{ universeSize }} tickers)
        </label>
      </div>

      <textarea
        v-if="mode === 'manual'"
        v-model="symbolsInput"
        rows="2"
        class="symbols-input"
        placeholder="e.g. BBRI, BBCA, TLKM"
      />
      <p v-else class="hint hint--inline">
        Screens all {{ universeSize }} tickers from Stockbit's market-wide list
        (captured 2026-09-04) — not an official IDX register, so a few newly
        listed or inactive names may be missing. Sequential Yahoo Finance
        fetches, 10 at a time: expect roughly 1-3 minutes.
      </p>

      <button class="run-button" :disabled="isLoading" @click="onRun">
        <span v-if="isLoading" class="spinner" aria-hidden="true" />
        {{ isLoading ? "Running..." : "Run screener" }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <p v-if="response" class="summary">
      <strong>{{ matchedResults.length }}</strong> match(es) out of
      {{ response.results.length }} screened ({{ response.errors.length }}
      failed to fetch).
      <span
        v-if="filteredResults.length !== matchedResults.length"
        class="summary__filtered"
      >
        Showing {{ filteredResults.length }} after filters.
      </span>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="link-button"
        @click="clearFilters"
      >
        Clear filters
      </button>
    </p>

    <div v-if="response && matchedResults.length > 0" class="table-toolbar">
      <div class="export-buttons">
        <button
          type="button"
          class="export-btn export-btn--primary"
          @click="downloadResults(sortedResults, 'csv')"
        >
          Download CSV
        </button>
        <button
          type="button"
          class="export-btn"
          @click="downloadResults(sortedResults, 'xlsx')"
        >
          Download XLSX
        </button>
      </div>
      <input
        v-model="symbolQuery"
        type="search"
        class="table-search"
        placeholder="Search symbol or name…"
      />
    </div>

    <div v-if="response && matchedResults.length > 0" class="table-wrap card">
      <table>
        <thead>
          <tr class="header-row">
            <th>
              <ScreenerSortableHeader
                :active="sortColumn === 'symbol'"
                :direction="sortDirection"
                @sort="toggleSort('symbol')"
              >
                Emiten
              </ScreenerSortableHeader>
            </th>
            <th class="col-close">
              <div class="col-title">
                <ScreenerSortableHeader
                  :active="sortColumn === 'lastClose'"
                  :direction="sortDirection"
                  @sort="toggleSort('lastClose')"
                >
                  Last close
                </ScreenerSortableHeader>
                <ScreenerColumnFilterPopover
                  label="Filter by last close range"
                  :active="isCloseFilterActive"
                >
                  <p class="popover-panel__label">Range</p>
                  <div class="filter-range">
                    <input
                      v-model.number="minClose"
                      type="number"
                      class="filter-input filter-input--num"
                      placeholder="Min"
                    />
                    <span class="filter-range__sep">–</span>
                    <input
                      v-model.number="maxClose"
                      type="number"
                      class="filter-input filter-input--num"
                      placeholder="Max"
                    />
                  </div>
                </ScreenerColumnFilterPopover>
              </div>
            </th>
            <th class="col-conviction">
              <div class="col-title">
                <ScreenerSortableHeader
                  :active="sortColumn === 'conviction'"
                  :direction="sortDirection"
                  @sort="toggleSort('conviction')"
                >
                  Conviction
                </ScreenerSortableHeader>
                <ScreenerColumnFilterPopover
                  label="Filter by conviction"
                  :count="activeConviction.length"
                  :active="activeConviction.length > 0"
                >
                  <p class="popover-panel__label">Conviction</p>
                  <div class="filter-chips">
                    <button
                      v-for="level in CONVICTION_OPTIONS"
                      :key="level"
                      type="button"
                      class="chip chip--confidence"
                      :class="[
                        `chip--${level}`,
                        { 'chip--active': activeConviction.includes(level) },
                      ]"
                      @click="toggleConviction(level)"
                    >
                      {{ level }}
                    </button>
                  </div>
                </ScreenerColumnFilterPopover>
              </div>
            </th>
            <th>
              <div class="col-title">
                <ScreenerSortableHeader
                  :active="sortColumn === 'matches'"
                  :direction="sortDirection"
                  @sort="toggleSort('matches')"
                >
                  Criteria matched
                </ScreenerSortableHeader>
                <ScreenerColumnFilterPopover
                  label="Filter by criterion or confidence"
                  :count="criteriaFilterCount"
                  :active="criteriaFilterCount > 0"
                >
                  <p class="popover-panel__label">Criterion</p>
                  <div class="filter-chips">
                    <button
                      v-for="criterion in CRITERIA_OPTIONS"
                      :key="criterion"
                      type="button"
                      class="chip"
                      :class="{
                        'chip--active': activeCriteria.includes(criterion),
                      }"
                      @click="toggleCriterion(criterion)"
                    >
                      {{ CRITERION_LABELS[criterion] }}
                    </button>
                  </div>
                  <p class="popover-panel__label">Confidence</p>
                  <div class="filter-chips">
                    <button
                      v-for="level in CONFIDENCE_OPTIONS"
                      :key="level"
                      type="button"
                      class="chip chip--confidence"
                      :class="[
                        `chip--${level}`,
                        { 'chip--active': activeConfidence.includes(level) },
                      ]"
                      @click="toggleConfidence(level)"
                    >
                      {{ level }}
                    </button>
                  </div>
                </ScreenerColumnFilterPopover>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="result in sortedResults"
            :key="result.symbol"
            class="data-row"
          >
            <td>
              <div class="emiten">
                <span class="emiten__symbol">{{ result.symbol }}</span>
                <span class="emiten__name">{{ result.name }}</span>
              </div>
            </td>
            <td class="col-close">{{ result.lastClose.toFixed(0) }}</td>
            <td class="col-conviction">
              <span
                class="badge badge--conviction"
                :class="`badge--${computeConviction(result.matches)}`"
              >
                {{ computeConviction(result.matches) }}
              </span>
            </td>
            <td>
              <ul class="matches">
                <li
                  v-for="match in result.matches"
                  :key="match.criterion"
                  class="match"
                >
                  <span class="match__label">{{
                    CRITERION_LABELS[match.criterion]
                  }}</span>
                  <span class="badge" :class="`badge--${match.confidence}`">
                    {{ match.confidence }}
                  </span>
                  <span class="match__detail">{{ match.detail }}</span>
                </li>
              </ul>
            </td>
          </tr>
          <tr v-if="filteredResults.length === 0">
            <td colspan="4" class="empty-state">
              No matches with the current filters.
              <button type="button" class="link-button" @click="clearFilters">
                Clear filters
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <details v-if="response && response.errors.length > 0" class="errors card">
      <summary>{{ response.errors.length }} symbol(s) failed to fetch</summary>
      <ul>
        <li v-for="item in response.errors" :key="item.symbol">
          {{ item.symbol }}: {{ item.message }}
        </li>
      </ul>
    </details>
  </section>
</template>

<style scoped src="./index.css"></style>
