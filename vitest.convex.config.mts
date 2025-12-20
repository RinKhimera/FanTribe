import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Convex functions run in an edge-like environment
    environment: "node",
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
    include: ["tests/convex/**/*.test.ts"],
  },
})
