import { ref } from "vue";
import type { Ref } from "vue";
import type { ScreenerResponse, ScreenerResult } from "../types";
import { $fetch } from "#imports";

export interface RunOptions {
  symbols: string[];
  bars?: number;
  thresholdPct?: number;
  chunkSize?: number;
}

export interface ScreenProgress {
  done: number;
  total: number;
}

export interface UseScreenerReturn {
  isLoading: Ref<boolean>;
  progress: Ref<ScreenProgress | null>;
  response: Ref<ScreenerResponse | null>;
  error: Ref<string | null>;
  run: (options: RunOptions) => Promise<void>;
}

const DEFAULT_CHUNK_SIZE = 40;

function toChunks<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function useScreener(): UseScreenerReturn {
  const isLoading = ref(false);
  const progress = ref<ScreenProgress | null>(null);
  const response = ref<ScreenerResponse | null>(null);
  const error = ref<string | null>(null);

  async function run(options: RunOptions): Promise<void> {
    isLoading.value = true;
    error.value = null;

    const chunks = toChunks(
      options.symbols,
      options.chunkSize ?? DEFAULT_CHUNK_SIZE,
    );
    const results: ScreenerResult[] = [];
    const errors: ScreenerResponse["errors"] = [];
    progress.value = { done: 0, total: options.symbols.length };
    response.value = null;

    try {
      for (const chunk of chunks) {
        const chunkResponse = await $fetch<ScreenerResponse>("/api/screener", {
          query: {
            symbols: chunk.join(","),
            bars: options.bars,
            thresholdPct: options.thresholdPct,
          },
        });
        results.push(...chunkResponse.results);
        errors.push(...chunkResponse.errors);
        progress.value = {
          done: (progress.value?.done ?? 0) + chunk.length,
          total: options.symbols.length,
        };
        response.value = { results: [...results], errors: [...errors] };
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      isLoading.value = false;
      progress.value = null;
    }
  }

  return { isLoading, progress, response, error, run };
}
