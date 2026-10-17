import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Vitest harness (node environment).
 *
 * Aliases mirror the `paths` map in tsconfig.json. Order matters: Vite's
 * alias resolution uses prefix matching, so the more specific `@data` /
 * `@velite` entries MUST stay before the bare `@` entry.
 *
 * Component tests follow this project's convention of node-environment
 * `renderToStaticMarkup` (see markdownComponents.test.ts) rather than
 * jsdom + Testing Library.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@data": path.resolve(__dirname, "data"),
      "@velite": path.resolve(__dirname, ".velite/index"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
