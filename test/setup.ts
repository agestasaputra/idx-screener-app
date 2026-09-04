import createFetchMock from "vitest-fetch-mock";
import { vi } from "vitest";

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

// Mock Nuxt auto-imported composables that most unit tests touch.
vi.mock("#app", () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: {},
  })),
  navigateTo: vi.fn(),
  defineNuxtPlugin: vi.fn((plugin) => plugin),
  useState: vi.fn(() => ({ value: null })),
  useRoute: vi.fn(() => ({
    query: {},
    params: {},
    path: "/",
    fullPath: "/",
  })),
}));

// Mock localStorage for the Node test environment.
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal("localStorage", localStorageMock);
