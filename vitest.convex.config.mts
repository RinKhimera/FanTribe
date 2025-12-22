import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: "convex",
    // Convex functions run in an edge-like environment
    environment: "node",
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
    include: ["tests/convex/**/*.test.ts"],
    coverage: {
      include: ["convex/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "convex/_generated/**",
        "convex/auth.config.ts",
        "convex/http.ts",
      ],
    },
  },
})
