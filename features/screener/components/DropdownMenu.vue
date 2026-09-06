<script setup lang="ts">
import { ref, nextTick } from "vue";

defineProps<{
  label: string;
}>();

const PANEL_WIDTH = 160;

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
    class="dropdown-trigger"
    :class="{ 'dropdown-trigger--active': isOpen }"
    :aria-label="label"
    @click="toggle"
  >
    <slot name="trigger" />
  </button>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="panelRef"
      class="dropdown-panel"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      @click="close"
    >
      <slot />
    </div>
  </Teleport>
</template>

<style scoped src="./DropdownMenu.css"></style>
