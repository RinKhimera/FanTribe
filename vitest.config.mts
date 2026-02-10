import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    name: "frontend",
    environment: "happy-dom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    include: ["tests/frontend/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      include: [
        "lib/**/*.ts",
        "hooks/useDebounce.ts",
        "hooks/useDialogState.ts",
        "hooks/useKeyboardNavigation.ts",
        "hooks/useScrollLock.ts",
        "hooks/useAsyncHandler.ts",
        "schemas/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/types/**",
        "**/_generated/**",
        "**/index.ts",
        "lib/config/**",
        "lib/services/**",
        "lib/errors/**",
        "lib/animations.ts",
      ],
      thresholds: {
        lines: 75,
        branches: 75,
        functions: 75,
        statements: 75,
      },
    },
  },
})
