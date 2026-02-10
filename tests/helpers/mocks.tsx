/**
 * Shared mock definitions for frontend tests.
 *
 * Usage: vi.mock() calls must be at the top level of each test file.
 * Import these factories to avoid duplicating mock implementations:
 *
 * vi.mock("motion/react", () => motionMock)
 * vi.mock("@/lib/config/env.client", () => envClientMock)
 * vi.mock("@/lib/config/logger", () => loggerMock)
 * vi.mock("@clerk/nextjs", () => clerkMock)
 */
import { vi } from "vitest"

// motion/react — converts motion.* to plain HTML elements
export const motionMock = {
  motion: {
    div: ({
      children,
      onPointerDown,
      ...props
    }: React.PropsWithChildren<{
      onPointerDown?: () => void
      [key: string]: unknown
    }>) => (
      <div {...props} onPointerDown={onPointerDown}>
        {children}
      </div>
    ),
    p: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}

// @/lib/config/env.client
export const envClientMock = {
  clientEnv: {
    NEXT_PUBLIC_CONVEX_URL: "https://test.convex.cloud",
  },
}

// @/lib/config/logger
export const createLoggerMock = () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
})

// @clerk/nextjs
export const clerkMock = {
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("test-token") }),
}
