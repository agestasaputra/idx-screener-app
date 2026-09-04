<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean;
    direction?: "asc" | "desc";
  }>(),
  { active: false, direction: "asc" },
);

defineEmits<{ sort: [] }>();
</script>

<template>
  <button
    type="button"
    class="col-sort"
    :class="{ 'col-sort--active': active }"
    @click="$emit('sort')"
  >
    <span><slot /></span>
    <svg
      viewBox="0 0 20 20"
      class="col-sort__icon"
      :class="{ 'col-sort__icon--desc': active && direction === 'desc' }"
      aria-hidden="true"
    >
      <path d="M10 6l-5 5h10l-5-5z" />
    </svg>
  </button>
</template>

<style scoped src="./SortableHeader.css"></style>
