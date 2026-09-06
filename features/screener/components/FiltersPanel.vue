<script setup lang="ts">
import { CRITERION_LABELS } from "../constants";
import type { ConfidenceLevel, ScreenerCriterion } from "../types";

defineProps<{
  activeCriteria: ScreenerCriterion[];
  activeConfidence: ConfidenceLevel[];
  activeSectors: string[];
  criteriaOptions: ScreenerCriterion[];
  confidenceOptions: ConfidenceLevel[];
  sectorOptions: string[];
  filterCount: number;
}>();

const emit = defineEmits<{
  "toggle-criterion": [criterion: ScreenerCriterion];
  "toggle-confidence": [level: ConfidenceLevel];
  "toggle-sector": [sector: string];
  clear: [];
}>();

const minClose = defineModel<number | null>("minClose", { default: null });
const maxClose = defineModel<number | null>("maxClose", { default: null });
</script>

<template>
  <div class="filter-panel">
    <div class="filter-panel__header">
      <span class="filter-panel__title">Filters</span>
      <button
        v-if="filterCount > 0"
        type="button"
        class="link-button"
        @click="emit('clear')"
      >
        Clear all
      </button>
    </div>

    <div class="filter-section">
      <p class="popover-panel__label">Last close range</p>
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
    </div>

    <div v-if="sectorOptions.length > 0" class="filter-section">
      <p class="popover-panel__label">Sector</p>
      <div class="filter-chips">
        <button
          v-for="sector in sectorOptions"
          :key="sector"
          type="button"
          class="chip"
          :class="{ 'chip--active': activeSectors.includes(sector) }"
          @click="emit('toggle-sector', sector)"
        >
          {{ sector }}
        </button>
      </div>
    </div>

    <div class="filter-section">
      <p class="popover-panel__label">Criteria</p>
      <div class="filter-chips">
        <button
          v-for="criterion in criteriaOptions"
          :key="criterion"
          type="button"
          class="chip"
          :class="{ 'chip--active': activeCriteria.includes(criterion) }"
          @click="emit('toggle-criterion', criterion)"
        >
          {{ CRITERION_LABELS[criterion] }}
        </button>
      </div>
    </div>

    <div class="filter-section">
      <p class="popover-panel__label">Confidence</p>
      <div class="filter-chips">
        <button
          v-for="level in confidenceOptions"
          :key="level"
          type="button"
          class="chip chip--confidence"
          :class="[
            `chip--${level}`,
            { 'chip--active': activeConfidence.includes(level) },
          ]"
          @click="emit('toggle-confidence', level)"
        >
          {{ level }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./FiltersPanel.css"></style>
