import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Vitest harness for the chatbot guardrails change (node environment,
 * `@` → `src` alias matching tsconfig.json paths).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
