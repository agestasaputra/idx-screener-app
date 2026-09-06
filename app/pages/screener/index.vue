<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useScreener } from "~~/features/screener/composables/useScreener";
import { CRITERION_LABELS } from "~~/features/screener/constants";
import type {
  ConfidenceLevel,
  CriterionMatch,
  Mode,
  ScreenerCriterion,
  ScreenerResult,
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

const {
  collapsed: sidebarCollapsed,
  toggle: toggleSidebar,
  init: initSidebar,
} = useSidebarCollapse();
onMounted(initSidebar);

const CRITERIA_OPTIONS = Object.keys(CRITERION_LABELS) as ScreenerCriterion[];
const CONFIDENCE_OPTIONS: ConfidenceLevel[] = ["high", "medium", "low"];

const matchedResults = computed(
  () => response.value?.results.filter((r) => r.matches.length > 0) ?? [],
);

const sectorOptions = computed(() => {
  const sectors = new Set<string>();
  for (const result of matchedResults.value) {
    if (result.sector) sectors.add(result.sector);
  }
  return [...sectors].sort();
});

// Column filters
const symbolQuery = ref("");
const minClose = ref<number | null>(null);
const maxClose = ref<number | null>(null);
const activeCriteria = ref<ScreenerCriterion[]>([]);
const activeConfidence = ref<ConfidenceLevel[]>([]);
const activeSectors = ref<string[]>([]);

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
const toggleSector = (sector: string): void =>
  toggle(activeSectors.value, sector);

const isCloseFilterActive = computed(
  () => minClose.value !== null || maxClose.value !== null,
);

const columnFilterCount = computed(
  () =>
    (isCloseFilterActive.value ? 1 : 0) +
    activeCriteria.value.length +
    activeConfidence.value.length +
    activeSectors.value.length,
);

const hasActiveFilters = computed(
  () => symbolQuery.value.trim().length > 0 || columnFilterCount.value > 0,
);

function clearColumnFilters(): void {
  minClose.value = null;
  maxClose.value = null;
  activeCriteria.value = [];
  activeConfidence.value = [];
  activeSectors.value = [];
}

function clearFilters(): void {
  symbolQuery.value = "";
  clearColumnFilters();
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

function matchesSector(result: ScreenerResult): boolean {
  if (activeSectors.value.length === 0) return true;
  return result.sector !== null && activeSectors.value.includes(result.sector);
}

function matchFor(
  result: ScreenerResult,
  criterion: ScreenerCriterion,
): CriterionMatch | undefined {
  return result.matches.find((m) => m.criterion === criterion);
}

const filteredResults = computed(() => {
  const query = symbolQuery.value.trim().toLowerCase();
  return matchedResults.value.filter(
    (result) =>
      matchesSearch(result, query) &&
      matchesCloseRange(result) &&
      matchesCriteria(result) &&
      matchesConfidence(result) &&
      matchesSector(result),
  );
});

type SortColumn =
  "symbol" | "lastClose" | "sector" | "matches" | ScreenerCriterion;
type SortDirection = "asc" | "desc";

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const sortColumn = ref<SortColumn | null>("ma_melilit");
const sortDirection = ref<SortDirection>("desc");

function toggleSort(column: SortColumn): void {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortDirection.value = "asc";
  }
}

function confidenceRank(
  result: ScreenerResult,
  criterion: ScreenerCriterion,
): number {
  const match = matchFor(result, criterion);
  return match ? CONFIDENCE_RANK[match.confidence] : -1;
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
    case "sector":
      return (a.sector ?? "").localeCompare(b.sector ?? "");
    case "matches":
      return a.matches.length - b.matches.length;
    default:
      return confidenceRank(a, column) - confidenceRank(b, column);
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

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const pageSize = ref(50);
const currentPage = ref(1);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedResults.value.length / pageSize.value)),
);

const pagedResults = computed(() => {
  const page = Math.min(currentPage.value, totalPages.value);
  const start = (page - 1) * pageSize.value;
  return sortedResults.value.slice(start, start + pageSize.value);
});

// Any filter or a fresh run reshapes the result set, so the current page
// index may no longer make sense — jump back to page 1 rather than risk
// landing on an out-of-range or confusingly-offset page.
watch(filteredResults, () => {
  currentPage.value = 1;
});
watch(pageSize, () => {
  currentPage.value = 1;
});

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
      <aside
        class="sidebar"
        :class="{ 'sidebar--collapsed': sidebarCollapsed }"
      >
        <button
          type="button"
          class="sidebar-toggle"
          :aria-label="
            sidebarCollapsed ? 'Expand controls' : 'Collapse controls'
          "
          @click="toggleSidebar"
        >
          <svg
            viewBox="0 0 20 20"
            class="sidebar-toggle__icon"
            :class="{ 'sidebar-toggle__icon--flipped': sidebarCollapsed }"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <ScreenerRunControls
          v-show="!sidebarCollapsed"
          v-model:mode="mode"
          v-model:symbols-input="symbolsInput"
          v-model:bars="bars"
          v-model:threshold-pct="thresholdPct"
          :universe-size="universeSize"
          :is-loading="isLoading"
          :progress="progress"
          :progress-percent="progressPercent"
          @run="onRun"
        />
        <ScreenerFiltersPanel
          v-show="!sidebarCollapsed"
          v-model:min-close="minClose"
          v-model:max-close="maxClose"
          :active-criteria="activeCriteria"
          :active-confidence="activeConfidence"
          :active-sectors="activeSectors"
          :criteria-options="CRITERIA_OPTIONS"
          :confidence-options="CONFIDENCE_OPTIONS"
          :sector-options="sectorOptions"
          :filter-count="columnFilterCount"
          @toggle-criterion="toggleCriterion"
          @toggle-confidence="toggleConfidence"
          @toggle-sector="toggleSector"
          @clear="clearColumnFilters"
        />
      </aside>

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
