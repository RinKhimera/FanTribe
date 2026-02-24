import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: "convex",
    // Convex functions run in an edge-like environment
    environment: "node",
    setupFiles: ["./vitest.convex.setup.ts"],
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
    include: ["tests/convex/**/*.test.ts"],
    coverage: {
      include: [
        "convex/bans.ts",
        "convex/comments.ts",
        "convex/creatorApplications.ts",
        "convex/notifications.ts",
        "convex/notificationQueue.ts",
        "convex/reports.ts",
        "convex/subscriptions.ts",
        "convex/lib/auth.ts",
        "convex/lib/batch.ts",
        "convex/lib/blocks.ts",
        "convex/lib/rateLimiter.ts",
        "convex/lib/validators.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "convex/_generated/**",
      ],
      thresholds: {
        lines: 65,
        branches: 50,
        functions: 60,
        statements: 65,
      },
    },
  },
})
