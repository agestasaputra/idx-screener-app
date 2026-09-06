import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { matchFor } from "../utils/matchFor";
import type {
  ConfidenceLevel,
  ScreenerCriteria,
  ScreenerResult,
} from "../types";

export type SortColumn =
  "symbol" | "lastClose" | "sector" | "matches" | ScreenerCriteria;
export type SortDirection = "asc" | "desc";

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function confidenceRank(
  result: ScreenerResult,
  criteria: ScreenerCriteria,
): number {
  const match = matchFor(result, criteria);
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

export interface UseScreenerSortReturn {
  sortColumn: Ref<SortColumn | null>;
  sortDirection: Ref<SortDirection>;
  toggleSort: (column: SortColumn) => void;
  sortedResults: ComputedRef<ScreenerResult[]>;
}

export function useScreenerSort(
  filteredResults: ComputedRef<ScreenerResult[]>,
  initialColumn: SortColumn,
  initialDirection: SortDirection = "asc",
): UseScreenerSortReturn {
  const sortColumn = ref<SortColumn | null>(initialColumn);
  const sortDirection = ref<SortDirection>(initialDirection);

  function toggleSort(column: SortColumn): void {
    if (sortColumn.value === column) {
      sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    } else {
      sortColumn.value = column;
      sortDirection.value = "asc";
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

  return { sortColumn, sortDirection, toggleSort, sortedResults };
}
