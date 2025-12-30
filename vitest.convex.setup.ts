import { beforeAll, afterAll } from "vitest"

/**
 * Handle "Write outside of transaction" errors from convex-test scheduler.
 * These occur when ctx.scheduler.runAfter() callbacks execute after test completion.
 * This is a known limitation of convex-test and doesn't affect test validity.
 */
const originalListeners: NodeJS.UnhandledRejectionListener[] = []

beforeAll(() => {
  // Store original listeners
  const listeners = process.listeners("unhandledRejection")
  originalListeners.push(
    ...(listeners as NodeJS.UnhandledRejectionListener[]),
  )

  // Remove all listeners
  process.removeAllListeners("unhandledRejection")

  // Add filtered listener
  process.on("unhandledRejection", (reason: unknown) => {
    // Ignore scheduler-related errors from convex-test
    if (
      reason instanceof Error &&
      reason.message.includes("Write outside of transaction") &&
      reason.message.includes("_scheduled_functions")
    ) {
      return
    }
    // Re-throw other errors
    throw reason
  })
})

afterAll(() => {
  // Restore original listeners
  process.removeAllListeners("unhandledRejection")
  originalListeners.forEach((listener) => {
    process.on("unhandledRejection", listener)
  })
})
