<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  values: number[];
}>();

const WIDTH = 64;
const HEIGHT = 24;
const PADDING = 2;

const points = computed(() => {
  const values = props.values;
  if (values.length < 2) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (WIDTH - PADDING * 2) / (values.length - 1);

  return values
    .map((value, i) => {
      const x = PADDING + i * step;
      const y =
        HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
});

const baselineY = computed(() => {
  const values = props.values;
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return (
    HEIGHT - PADDING - ((values[0]! - min) / range) * (HEIGHT - PADDING * 2)
  );
});

const isUp = computed(() => {
  const values = props.values;
  if (values.length < 2) return true;
  return values[values.length - 1]! >= values[0]!;
});
</script>

<template>
  <svg
    v-if="points"
    :width="WIDTH"
    :height="HEIGHT"
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    class="sparkline"
    aria-hidden="true"
  >
    <line
      v-if="baselineY !== null"
      :x1="0"
      :y1="baselineY"
      :x2="WIDTH"
      :y2="baselineY"
      class="sparkline__baseline"
    />
    <polyline
      :points="points"
      fill="none"
      class="sparkline__line"
      :class="isUp ? 'sparkline__line--up' : 'sparkline__line--down'"
    />
  </svg>
</template>

<style scoped src="./PriceSparkline.css"></style>
