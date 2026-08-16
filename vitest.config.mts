import { defineConfig } from "vitest/config";
import path from "node:path";

// Minimal config: no React/DOM plugin needed since the suite only exercises
// pure calculation modules and route handlers, never renders components.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
