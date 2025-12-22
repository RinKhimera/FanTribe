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
    include: [
      "lib/**/*.test.ts",
      "components/**/*.test.tsx",
      "hooks/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/convex/**"],
    coverage: {
      include: ["lib/**/*.ts", "components/**/*.tsx", "hooks/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/types/**",
        "**/_generated/**",
      ],
    },
  },
})
