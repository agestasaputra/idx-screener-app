import { computed, ref, watch } from "vue";
import type { ComputedRef, Ref } from "vue";
import type { ScreenerResult } from "../types";

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export interface UseScreenerPaginationReturn {
  pageSize: Ref<number>;
  currentPage: Ref<number>;
  totalPages: ComputedRef<number>;
  pagedResults: ComputedRef<ScreenerResult[]>;
}

export function useScreenerPagination(
  sortedResults: ComputedRef<ScreenerResult[]>,
  resetOn: ComputedRef<unknown>,
): UseScreenerPaginationReturn {
  const pageSize = ref(25);
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
  watch(resetOn, () => {
    currentPage.value = 1;
  });
  watch(pageSize, () => {
    currentPage.value = 1;
  });

  return { pageSize, currentPage, totalPages, pagedResults };
}
