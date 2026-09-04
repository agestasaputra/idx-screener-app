import path from "path";
import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["features/**/*.{ts,vue}", "common/**/*.{ts,vue}"],
      exclude: [
        "node_modules",
        "dist",
        ".pnpm-store",
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/types/**",
        "**/@types/**",
        "**/constants/**",
      ],
      all: false,
    },
    setupFiles: "./test/setup.ts",
    reporters: [
      "default",
      ["vitest-sonar-reporter", { outputFile: "coverage/test-reporter.xml" }],
    ],
    exclude: ["node_modules", "dist", ".pnpm-store"],
    browser: {
      enabled: false,
      name: "chromium",
      provider: "playwright",
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./"),
      "@": path.resolve(__dirname, "./"),
    },
  },
});
