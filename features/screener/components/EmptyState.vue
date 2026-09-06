<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="empty-run card">
    <svg viewBox="0 0 20 20" class="empty-run__icon" aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
        clip-rule="evenodd"
      />
    </svg>
    <h2 class="empty-run__title">{{ title }}</h2>
    <p class="empty-run__text">
      <slot />
    </p>
  </div>
</template>

<style scoped src="./EmptyState.css"></style>
