import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { matchesFilters } from "../utils/filterPredicates";
import type {
  ConfidenceLevel,
  ScreenerCriteria,
  ScreenerResult,
} from "../types";

function toggle<T>(list: T[], value: T): void {
  const idx = list.indexOf(value);
  if (idx === -1) {
    list.push(value);
  } else {
    list.splice(idx, 1);
  }
}

function collectSectors(results: ScreenerResult[]): string[] {
  const sectors = new Set<string>();
  for (const result of results) {
    if (result.sector) sectors.add(result.sector);
  }
  return [...sectors].sort();
}

interface FilterState {
  symbolQuery: Ref<string>;
  minClose: Ref<number | null>;
  maxClose: Ref<number | null>;
  activeCriteria: Ref<ScreenerCriteria[]>;
  activeConfidence: Ref<ConfidenceLevel[]>;
  activeSectors: Ref<string[]>;
  toggleCriteria: (criteria: ScreenerCriteria) => void;
  toggleConfidence: (level: ConfidenceLevel) => void;
  toggleSector: (sector: string) => void;
  clearColumnFilters: () => void;
  clearFilters: () => void;
}

// Raw filter state: refs, toggles, and resets — no derived values, so this
// stays a single, easy-to-follow concern.
function useFilterState(): FilterState {
  const symbolQuery = ref("");
  const minClose = ref<number | null>(null);
  const maxClose = ref<number | null>(null);
  const activeCriteria = ref<ScreenerCriteria[]>([]);
  const activeConfidence = ref<ConfidenceLevel[]>([]);
  const activeSectors = ref<string[]>([]);

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

  return {
    symbolQuery,
    minClose,
    maxClose,
    activeCriteria,
    activeConfidence,
    activeSectors,
    toggleCriteria: (criteria) => toggle(activeCriteria.value, criteria),
    toggleConfidence: (level) => toggle(activeConfidence.value, level),
    toggleSector: (sector) => toggle(activeSectors.value, sector),
    clearColumnFilters,
    clearFilters,
  };
}

export type UseScreenerFiltersReturn = FilterState & {
  sectorOptions: ComputedRef<string[]>;
  columnFilterCount: ComputedRef<number>;
  hasActiveFilters: ComputedRef<boolean>;
  filteredResults: ComputedRef<ScreenerResult[]>;
};

export function useScreenerFilters(
  matchedResults: ComputedRef<ScreenerResult[]>,
): UseScreenerFiltersReturn {
  const state = useFilterState();
  const {
    symbolQuery,
    minClose,
    maxClose,
    activeCriteria,
    activeConfidence,
    activeSectors,
  } = state;

  const sectorOptions = computed(() => collectSectors(matchedResults.value));

  const columnFilterCount = computed(
    () =>
      (minClose.value !== null || maxClose.value !== null ? 1 : 0) +
      activeCriteria.value.length +
      activeConfidence.value.length +
      activeSectors.value.length,
  );

  const hasActiveFilters = computed(
    () => symbolQuery.value.trim().length > 0 || columnFilterCount.value > 0,
  );

  const filteredResults = computed(() =>
    matchedResults.value.filter((result) =>
      matchesFilters(result, {
        query: symbolQuery.value.trim().toLowerCase(),
        minClose: minClose.value,
        maxClose: maxClose.value,
        criteria: activeCriteria.value,
        confidence: activeConfidence.value,
        sectors: activeSectors.value,
      }),
    ),
  );

  return {
    ...state,
    sectorOptions,
    columnFilterCount,
    hasActiveFilters,
    filteredResults,
  };
}
