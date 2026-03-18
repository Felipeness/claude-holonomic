import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  oxc: {
    tsconfig: {
      configFile: resolve(import.meta.dirname, "tsconfig.base.json"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/__tests__/**/*.test.ts", "holons/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["packages/*/src/**/*.ts", "holons/*/domain/**/*.ts"],
    },
  },
})
