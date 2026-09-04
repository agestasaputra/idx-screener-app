<script setup lang="ts">
import { ref, nextTick } from "vue";

withDefaults(
  defineProps<{
    label: string;
    active?: boolean;
    count?: number;
  }>(),
  { active: false, count: 0 },
);

const PANEL_WIDTH = 240;

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const position = ref({ top: 0, left: 0 });

function updatePosition(): void {
  const trigger = triggerRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  position.value = {
    top: rect.bottom + 6,
    left: Math.max(8, rect.right - PANEL_WIDTH),
  };
}

function close(): void {
  isOpen.value = false;
}

async function toggle(): Promise<void> {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    await nextTick();
    updatePosition();
  }
}

onClickOutside(panelRef, close, { ignore: [triggerRef] });

useEventListener(
  window,
  "scroll",
  () => {
    if (isOpen.value) close();
  },
  true,
);
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    class="filter-icon-btn"
    :class="{ 'filter-icon-btn--active': active }"
    :aria-label="label"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" class="filter-icon" aria-hidden="true">
      <path
        d="M3.792 2.938A49.069 49.069 0 0 1 12 2.25c2.797 0 5.54.236 8.209.688a1.857 1.857 0 0 1 1.541 1.836v1.044a3 3 0 0 1-.879 2.121l-6.182 6.182a1.5 1.5 0 0 0-.439 1.061v2.927a3 3 0 0 1-1.658 2.684l-1.757.878A.75.75 0 0 1 9.75 21v-5.818a1.5 1.5 0 0 0-.44-1.06L3.13 7.938a3 3 0 0 1-.879-2.121V4.774c0-.897.64-1.683 1.542-1.836Z"
      />
    </svg>
    <span v-if="count > 0" class="filter-trigger__count">{{ count }}</span>
  </button>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="panelRef"
      class="popover-panel"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <slot />
    </div>
  </Teleport>
</template>

<style scoped src="./ColumnFilterPopover.css"></style>
