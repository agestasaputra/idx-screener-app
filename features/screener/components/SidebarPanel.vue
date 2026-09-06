<script setup lang="ts">
import { onMounted } from "vue";
import type { ConfidenceLevel, Mode, ScreenerCriteria } from "../types";
import type { ScreenProgress } from "../composables/useScreener";

defineProps<{
  universeSize: number;
  isLoading: boolean;
  progress: ScreenProgress | null;
  progressPercent: number;
  activeCriteria: ScreenerCriteria[];
  activeConfidence: ConfidenceLevel[];
  activeSectors: string[];
  criteriaOptions: ScreenerCriteria[];
  confidenceOptions: ConfidenceLevel[];
  sectorOptions: string[];
  filterCount: number;
}>();

defineEmits<{
  run: [];
  "toggle-criteria": [criteria: ScreenerCriteria];
  "toggle-confidence": [level: ConfidenceLevel];
  "toggle-sector": [sector: string];
  clear: [];
}>();

const mode = defineModel<Mode>("mode", { required: true });
const symbolsInput = defineModel<string>("symbolsInput", { required: true });
const bars = defineModel<number>("bars", { required: true });
const thresholdPct = defineModel<number>("thresholdPct", { required: true });
const minClose = defineModel<number | null>("minClose", { required: true });
const maxClose = defineModel<number | null>("maxClose", { required: true });

const {
  collapsed,
  toggle: toggleCollapsed,
  init: initCollapsed,
} = useSidebarCollapse();
onMounted(initCollapsed);
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <button
      type="button"
      class="sidebar-toggle"
      :aria-label="collapsed ? 'Expand controls' : 'Collapse controls'"
      @click="toggleCollapsed"
    >
      <svg
        viewBox="0 0 20 20"
        class="sidebar-toggle__icon"
        :class="{ 'sidebar-toggle__icon--flipped': collapsed }"
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
      v-show="!collapsed"
      v-model:mode="mode"
      v-model:symbols-input="symbolsInput"
      v-model:bars="bars"
      v-model:threshold-pct="thresholdPct"
      :universe-size="universeSize"
      :is-loading="isLoading"
      :progress="progress"
      :progress-percent="progressPercent"
      @run="$emit('run')"
    />
    <ScreenerFiltersPanel
      v-show="!collapsed"
      v-model:min-close="minClose"
      v-model:max-close="maxClose"
      :active-criteria="activeCriteria"
      :active-confidence="activeConfidence"
      :active-sectors="activeSectors"
      :criteria-options="criteriaOptions"
      :confidence-options="confidenceOptions"
      :sector-options="sectorOptions"
      :filter-count="filterCount"
      @toggle-criteria="$emit('toggle-criteria', $event)"
      @toggle-confidence="$emit('toggle-confidence', $event)"
      @toggle-sector="$emit('toggle-sector', $event)"
      @clear="$emit('clear')"
    />
  </aside>
</template>

<style scoped src="./SidebarPanel.css"></style>
