import { ref } from "vue";
import type { Ref } from "vue";
import type { ScreenerResponse } from "../types";
import { $fetch } from "#imports";

export interface RunOptions {
  symbols?: string[];
  bars?: number;
  limit?: number;
}

export interface UseScreenerReturn {
  isLoading: Ref<boolean>;
  response: Ref<ScreenerResponse | null>;
  error: Ref<string | null>;
  run: (options?: RunOptions) => Promise<void>;
}

export function useScreener(): UseScreenerReturn {
  const isLoading = ref(false);
  const response = ref<ScreenerResponse | null>(null);
  const error = ref<string | null>(null);

  async function run(options: RunOptions = {}): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      response.value = await $fetch<ScreenerResponse>("/api/screener", {
        query: {
          symbols: options.symbols?.join(","),
          bars: options.bars,
          limit: options.limit,
        },
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, response, error, run };
}
