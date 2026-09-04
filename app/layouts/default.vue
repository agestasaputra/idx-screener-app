<script setup lang="ts">
const { scheme, toggle } = useColorScheme();
</script>

<template>
  <div class="shell">
    <div class="layout">
      <header class="layout__header">
        <span class="layout__badge">IDX</span>
        <h1>IDX Screener</h1>
        <button
          type="button"
          class="theme-toggle"
          :aria-label="
            scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          "
          @click="toggle"
        >
          <svg
            v-if="scheme === 'dark'"
            viewBox="0 0 24 24"
            class="theme-toggle__icon"
            aria-hidden="true"
          >
            <path
              d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm9-6a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM5 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Zm13.66-6.66a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0ZM7.46 17.54a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0ZM12 20a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM6.34 6.34a1 1 0 0 1-1.41 0l-.71-.7a1 1 0 0 1 1.41-1.42l.71.71a1 1 0 0 1 0 1.41Zm12.32 12.32a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 1 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41Z"
            />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            class="theme-toggle__icon"
            aria-hidden="true"
          >
            <path
              d="M21.75 15.5A9.72 9.72 0 0 1 12.25 22 9.75 9.75 0 0 1 8.9 3.05a.75.75 0 0 1 .93.98A8.25 8.25 0 0 0 20 14.17a.75.75 0 0 1 1.75 1.33Z"
            />
          </svg>
        </button>
      </header>
      <main class="layout__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  background: var(--color-bg);
}

.layout {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.layout__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.layout__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.layout__header h1 {
  font-size: 1.35rem;
  color: var(--color-text);
  margin: 0;
}

.theme-toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-toggle:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.theme-toggle__icon {
  width: 1.1rem;
  height: 1.1rem;
  fill: currentColor;
}
</style>
