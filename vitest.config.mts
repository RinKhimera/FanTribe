import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    exclude: ["**/node_modules/**", "**/dist/**", "tests/convex/**/*.test.ts"],
  },
})
