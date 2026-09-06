<script setup lang="ts">
import { ref } from "vue";
import type { Mode } from "../types";
import type { ScreenProgress } from "../composables/useScreener";

defineProps<{
  universeSize: number;
  isLoading: boolean;
  progress: ScreenProgress | null;
  progressPercent: number;
}>();

defineEmits<{
  run: [];
}>();

const mode = defineModel<Mode>("mode", { required: true });
const symbolsInput = defineModel<string>("symbolsInput", { required: true });
const bars = defineModel<number>("bars", { required: true });
const thresholdPct = defineModel<number>("thresholdPct", { required: true });

const isHintExpanded = ref(false);
</script>

<template>
  <div class="controls">
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
    <div v-else class="hint-inline-wrap">
      <p
        class="hint hint--inline"
        :class="{ 'hint--truncated': !isHintExpanded }"
      >
        Screens all {{ universeSize }} tickers from Stockbit's market-wide list
        (captured 2026-09-04) — not an official IDX register, so a few newly
        listed or inactive names may be missing. Sequential Yahoo Finance
        fetches, 10 at a time: expect roughly 1-3 minutes.
      </p>
      <button
        type="button"
        class="hint__toggle"
        @click="isHintExpanded = !isHintExpanded"
      >
        {{ isHintExpanded ? "View less" : "View all" }}
      </button>
    </div>

    <details class="advanced">
      <summary>Advanced</summary>
      <label class="advanced__field">
        MA spread threshold (%)
        <input
          v-model.number="thresholdPct"
          type="number"
          min="0.1"
          step="0.1"
          class="advanced__input"
        />
      </label>
      <label class="advanced__field">
        Lookback (days)
        <input
          v-model.number="bars"
          type="number"
          min="30"
          step="10"
          class="advanced__input"
        />
      </label>
    </details>

    <button class="run-button" :disabled="isLoading" @click="$emit('run')">
      <span v-if="isLoading" class="spinner" aria-hidden="true" />
      {{ isLoading ? "Running..." : "Run screener" }}
    </button>

    <div v-if="isLoading && progress" class="progress">
      <div class="progress__header">
        <span class="progress__info">
          Screening {{ progress.done }} / {{ progress.total }} tickers…
        </span>
        <span class="progress__percent">{{ progressPercent }}%</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-bar__fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped src="./RunControls.css"></style>
