import type { Ref } from "vue";

const STORAGE_KEY = "idx-screener-sidebar-collapsed";

export function useSidebarCollapse(): {
  collapsed: Ref<boolean>;
  toggle: () => void;
  init: () => void;
} {
  const collapsed = useState<boolean>("sidebar-collapsed", () => false);

  function apply(value: boolean): void {
    collapsed.value = value;
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  }

  function init(): void {
    if (!import.meta.client) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) collapsed.value = stored === "true";
  }

  function toggle(): void {
    apply(!collapsed.value);
  }

  return { collapsed, toggle, init };
}
