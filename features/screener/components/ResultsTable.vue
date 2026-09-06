<script setup lang="ts">
import { CRITERIA_LABELS } from "../constants";
import { matchFor } from "../utils/matchFor";
import type { ScreenerCriteria, ScreenerResult } from "../types";

defineProps<{
  results: ScreenerResult[];
  criteriaOptions: ScreenerCriteria[];
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
}>();

const emit = defineEmits<{
  sort: [column: string];
  "clear-filters": [];
}>();
</script>

<template>
  <div class="table-wrap card">
    <table>
      <thead>
        <tr class="header-row">
          <th>
            <ScreenerSortableHeader
              :active="sortColumn === 'symbol'"
              :direction="sortDirection"
              @sort="emit('sort', 'symbol')"
            >
              Ticker
            </ScreenerSortableHeader>
          </th>
          <th class="col-close">
            <ScreenerSortableHeader
              :active="sortColumn === 'lastClose'"
              :direction="sortDirection"
              @sort="emit('sort', 'lastClose')"
            >
              Last close
            </ScreenerSortableHeader>
          </th>
          <th class="col-sector">
            <ScreenerSortableHeader
              :active="sortColumn === 'sector'"
              :direction="sortDirection"
              @sort="emit('sort', 'sector')"
            >
              Sector
            </ScreenerSortableHeader>
          </th>
          <th class="col-matched">
            <ScreenerSortableHeader
              :active="sortColumn === 'matches'"
              :direction="sortDirection"
              @sort="emit('sort', 'matches')"
            >
              Matched
            </ScreenerSortableHeader>
          </th>
          <th
            v-for="criteria in criteriaOptions"
            :key="criteria"
            class="col-criteria"
          >
            <ScreenerSortableHeader
              :active="sortColumn === criteria"
              :direction="sortDirection"
              @sort="emit('sort', criteria)"
            >
              {{ CRITERIA_LABELS[criteria] }}
            </ScreenerSortableHeader>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result in results" :key="result.symbol" class="data-row">
          <td>
            <div class="ticker">
              <div class="ticker__info">
                <a
                  :href="`https://id.tradingview.com/chart/?symbol=${result.symbol}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ticker__symbol"
                >
                  {{ result.symbol }}
                </a>
                <span class="ticker__name">{{ result.name }}</span>
              </div>
              <ScreenerPriceSparkline :values="result.sparkline" />
            </div>
          </td>
          <td class="col-close">{{ result.lastClose.toFixed(0) }}</td>
          <td class="col-sector">{{ result.sector ?? "—" }}</td>
          <td class="col-matched">
            {{ result.matches.length }}/{{ criteriaOptions.length }}
          </td>
          <td
            v-for="criteria in criteriaOptions"
            :key="criteria"
            class="col-criteria"
          >
            <div v-if="matchFor(result, criteria)" class="match">
              <span
                class="badge"
                :class="`badge--${matchFor(result, criteria)!.confidence}`"
              >
                {{ matchFor(result, criteria)!.confidence }}
              </span>
              <span class="match__detail">{{
                matchFor(result, criteria)!.detail
              }}</span>
            </div>
            <span v-else class="match__empty">–</span>
          </td>
        </tr>
        <tr v-if="results.length === 0">
          <td colspan="7" class="empty-state">
            No matches with the current filters.
            <button
              type="button"
              class="link-button"
              @click="emit('clear-filters')"
            >
              Clear filters
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped src="./ResultsTable.css"></style>
