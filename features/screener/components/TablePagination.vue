<script setup lang="ts">
import { computed, watch } from "vue";

const props = defineProps<{
  totalItems: number;
  pageSizeOptions: number[];
}>();

const currentPage = defineModel<number>("currentPage", { required: true });
const pageSize = defineModel<number>("pageSize", { required: true });

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.totalItems / pageSize.value)),
);

// Safety net: if the page count shrinks out from under the current page
// (page size change, fewer rows after a re-run) clamp back into range
// instead of ever rendering an out-of-bounds/empty page.
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal;
});

const rangeStart = computed(() =>
  props.totalItems === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1,
);
const rangeEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, props.totalItems),
);

type PageEntry = number | "ellipsis";

// Windowed page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20. Below the
// threshold every page number is shown with no ellipses at all.
function getPageNumbers(current: number, total: number): PageEntry[] {
  const SIBLINGS = 1;
  const SHOW_ALL_THRESHOLD = 7;
  if (total <= SHOW_ALL_THRESHOLD) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(2, current - SIBLINGS);
  const right = Math.min(total - 1, current + SIBLINGS);
  const pages: PageEntry[] = [1];

  if (left > 2) pages.push("ellipsis");
  for (let page = left; page <= right; page++) pages.push(page);
  if (right < total - 1) pages.push("ellipsis");
  pages.push(total);

  return pages;
}

const pageNumbers = computed(() =>
  getPageNumbers(currentPage.value, totalPages.value),
);

function goTo(page: number): void {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value);
}
</script>

<template>
  <div class="pagination">
    <div class="pagination__info">
      <span>Showing {{ rangeStart }}–{{ rangeEnd }} of {{ totalItems }}</span>
      <label class="pagination__size">
        Rows per page
        <select v-model.number="pageSize" class="pagination__select">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </label>
    </div>

    <nav class="pagination__nav" aria-label="Table pagination">
      <button
        type="button"
        class="pagination__btn"
        :disabled="currentPage === 1"
        aria-label="First page"
        @click="goTo(1)"
      >
        «
      </button>
      <button
        type="button"
        class="pagination__btn"
        :disabled="currentPage === 1"
        aria-label="Previous page"
        @click="goTo(currentPage - 1)"
      >
        ‹
      </button>

      <template v-for="(page, i) in pageNumbers" :key="`${page}-${i}`">
        <span v-if="page === 'ellipsis'" class="pagination__ellipsis">…</span>
        <button
          v-else
          type="button"
          class="pagination__btn pagination__btn--page"
          :class="{ 'pagination__btn--active': page === currentPage }"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="goTo(page)"
        >
          {{ page }}
        </button>
      </template>

      <button
        type="button"
        class="pagination__btn"
        :disabled="currentPage === totalPages"
        aria-label="Next page"
        @click="goTo(currentPage + 1)"
      >
        ›
      </button>
      <button
        type="button"
        class="pagination__btn"
        :disabled="currentPage === totalPages"
        aria-label="Last page"
        @click="goTo(totalPages)"
      >
        »
      </button>
    </nav>
  </div>
</template>

<style scoped src="./TablePagination.css"></style>
