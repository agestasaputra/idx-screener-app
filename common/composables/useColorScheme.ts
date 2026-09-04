import type { Ref } from "vue";

export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "idx-screener-color-scheme";

function isColorScheme(value: string | null): value is ColorScheme {
  return value === "light" || value === "dark";
}

export function useColorScheme(): {
  scheme: Ref<ColorScheme>;
  toggle: () => void;
  init: () => void;
} {
  const scheme = useState<ColorScheme>("color-scheme", () => "dark");

  function apply(value: ColorScheme): void {
    scheme.value = value;
    if (import.meta.client) {
      document.documentElement.setAttribute("data-theme", value);
      localStorage.setItem(STORAGE_KEY, value);
    }
  }

  function init(): void {
    if (!import.meta.client) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    apply(isColorScheme(stored) ? stored : "dark");
  }

  function toggle(): void {
    apply(scheme.value === "dark" ? "light" : "dark");
  }

  return { scheme, toggle, init };
}
