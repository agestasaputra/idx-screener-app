<script setup lang="ts">
import { ref, computed } from "vue";
import { useScreener } from "~~/features/screener/composables/useScreener";
import { useScreenerFilters } from "~~/features/screener/composables/useScreenerFilters";
import {
  useScreenerSort,
  type SortColumn,
} from "~~/features/screener/composables/useScreenerSort";
import {
  useScreenerPagination,
  PAGE_SIZE_OPTIONS,
} from "~~/features/screener/composables/useScreenerPagination";
import { CRITERIA_LABELS } from "~~/features/screener/constants";
import type {
  ConfidenceLevel,
  Mode,
  ScreenerCriteria,
} from "~~/features/screener/types";
import { downloadResults } from "~~/features/screener/utils/exportResults";
import idxTickers from "~~/common/constants/idxTickers.json";

const mode = ref<Mode>("manual");
const symbolsInput = ref("BBRI,BBCA,TLKM,ASII,BMRI");
const { isLoading, progress, response, error, run } = useScreener();

const universeSize = idxTickers.length;

const runtimeConfig = useRuntimeConfig();
const bars = ref(Number(runtimeConfig.public.defaultBars));
const thresholdPct = ref(Number(runtimeConfig.public.maMelilitThresholdPct));

const CRITERIA_OPTIONS = Object.keys(CRITERIA_LABELS) as ScreenerCriteria[];
const CONFIDENCE_OPTIONS: ConfidenceLevel[] = ["high", "medium", "low"];

const matchedResults = computed(
  () => response.value?.results.filter((r) => r.matches.length > 0) ?? [],
);

const {
  sectorOptions,
  columnFilterCount,
  hasActiveFilters,
  filteredResults,
  minClose,
  maxClose,
  activeCriteria,
  activeConfidence,
  activeSectors,
  symbolQuery,
  toggleCriteria,
  toggleConfidence,
  toggleSector,
  clearColumnFilters,
  clearFilters,
} = useScreenerFilters(matchedResults);

const { sortColumn, sortDirection, toggleSort, sortedResults } =
  useScreenerSort(filteredResults, "ma_melilit", "desc");

const { pageSize, currentPage, pagedResults } = useScreenerPagination(
  sortedResults,
  filteredResults,
);

function parseSymbols(raw: string): string[] {
  return raw
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

async function onRun(): Promise<void> {
  clearFilters();
  const scanOptions = { bars: bars.value, thresholdPct: thresholdPct.value };
  if (mode.value === "full") {
    await run({
      symbols: idxTickers.map((ticker) => ticker.symbol),
      ...scanOptions,
    });
    return;
  }
  const symbols = parseSymbols(symbolsInput.value);
  if (symbols.length > 0) {
    await run({ symbols, ...scanOptions });
  }
}

const progressPercent = computed(() => {
  if (!progress.value || progress.value.total === 0) return 0;
  return Math.round((progress.value.done / progress.value.total) * 100);
});
</script>

<template>
  <section class="screener">
    <p class="hint">
      Checks MA Melilit, Adam &amp; Eve and Bullish Divergence from free Yahoo
      Finance daily data — a heuristic screen, not a verified signal.
    </p>

    <div class="screener-body">
      <ScreenerSidebarPanel
        v-model:mode="mode"
        v-model:symbols-input="symbolsInput"
        v-model:bars="bars"
        v-model:threshold-pct="thresholdPct"
        v-model:min-close="minClose"
        v-model:max-close="maxClose"
        :universe-size="universeSize"
        :is-loading="isLoading"
        :progress="progress"
        :progress-percent="progressPercent"
        :active-criteria="activeCriteria"
        :active-confidence="activeConfidence"
        :active-sectors="activeSectors"
        :criteria-options="CRITERIA_OPTIONS"
        :confidence-options="CONFIDENCE_OPTIONS"
        :sector-options="sectorOptions"
        :filter-count="columnFilterCount"
        @run="onRun"
        @toggle-criteria="toggleCriteria"
        @toggle-confidence="toggleConfidence"
        @toggle-sector="toggleSector"
        @clear="clearColumnFilters"
      />

      <div class="main-column">
        <p v-if="error" class="error">{{ error }}</p>

        <p v-if="response" class="summary">
          <strong>{{ matchedResults.length }}</strong> match(es) out of
          {{ response.results.length }} screened ({{ response.errors.length }}
          failed to fetch).
          <span
            v-if="filteredResults.length !== matchedResults.length"
            class="summary__filtered"
          >
            {{ filteredResults.length }} match(es) after filters.
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

        <ScreenerEmptyState
          v-if="!response"
          :title="isLoading ? 'Screening tickers…' : 'No results yet'"
        >
          <template v-if="isLoading">
            Sit tight — screening the whole IHSG universe can take a few
            minutes.
          </template>
          <template v-else>
            Set up your scan in the sidebar, then click "Run screener" to see
            matching tickers here.
          </template>
        </ScreenerEmptyState>

        <ScreenerEmptyState
          v-else-if="matchedResults.length === 0"
          title="No matches"
        >
          None of the {{ response.results.length }} ticker(s) screened matched
          MA Melilit, Adam &amp; Eve, or Bullish Divergence this run.
        </ScreenerEmptyState>

        <template v-else>
          <div class="table-toolbar">
            <ScreenerDropdownMenu label="Download results">
              <template #trigger>
                <svg
                  viewBox="0 0 24 24"
                  class="dropdown-icon"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3.75a.75.75 0 0 1 .75.75v9.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V4.5a.75.75 0 0 1 .75-.75Z"
                  />
                  <path
                    d="M4.5 15a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5v-2.25a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3v-2.25A.75.75 0 0 1 4.5 15Z"
                  />
                </svg>
                Download
                <svg
                  viewBox="0 0 24 24"
                  class="dropdown-icon dropdown-icon--sm"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </template>
              <button
                type="button"
                class="dropdown-item"
                @click="downloadResults(sortedResults, 'csv')"
              >
                <span>CSV</span>
                <span class="dropdown-item__hint">.csv</span>
              </button>
              <button
                type="button"
                class="dropdown-item"
                @click="downloadResults(sortedResults, 'xlsx')"
              >
                <span>Excel</span>
                <span class="dropdown-item__hint">.xlsx</span>
              </button>
            </ScreenerDropdownMenu>
            <input
              v-model="symbolQuery"
              type="search"
              class="table-search"
              placeholder="Search symbol or name…"
            />
          </div>

          <ScreenerResultsTable
            :results="pagedResults"
            :criteria-options="CRITERIA_OPTIONS"
            :sort-column="sortColumn"
            :sort-direction="sortDirection"
            @sort="(column) => toggleSort(column as SortColumn)"
            @clear-filters="clearFilters"
          />

          <ScreenerTablePagination
            v-if="filteredResults.length > 0"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total-items="filteredResults.length"
            :page-size-options="PAGE_SIZE_OPTIONS"
          />
        </template>

        <details
          v-if="response && response.errors.length > 0"
          class="errors card"
        >
          <summary>
            {{ response.errors.length }} symbol(s) failed to fetch
          </summary>
          <ul>
            <li v-for="item in response.errors" :key="item.symbol">
              {{ item.symbol }}: {{ item.message }}
            </li>
          </ul>
        </details>
      </div>
    </div>
  </section>
</template>

<style scoped src="./index.css"></style>
