import { renderHook, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockToast, mockLogger } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
  mockLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("sonner", () => ({ toast: mockToast }))
vi.mock("@/lib/config/logger", () => ({ logger: mockLogger }))

import { useAsyncHandler } from "@/hooks/useAsyncHandler"

describe("useAsyncHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("successful execution returns result", async () => {
    const { result } = renderHook(() => useAsyncHandler())

    let value: unknown
    await act(async () => {
      value = await result.current.execute(async () => "value")
    })

    expect(value).toBe("value")
  })

  it("success calls onSuccess callback with result", async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useAsyncHandler({ onSuccess })
    )

    await act(async () => {
      await result.current.execute(async () => "data")
    })

    expect(onSuccess).toHaveBeenCalledWith("data")
  })

  it("success shows toast when successMessage provided", async () => {
    const { result } = renderHook(() =>
      useAsyncHandler({ successMessage: "Done!" })
    )

    await act(async () => {
      await result.current.execute(async () => "ok")
    })

    expect(mockToast.success).toHaveBeenCalledWith("Done!", {
      description: undefined,
    })
  })

  it("error shows toast.error with error message", async () => {
    const { result } = renderHook(() =>
      useAsyncHandler({ errorMessage: "Oops" })
    )

    await act(async () => {
      await result.current.execute(async () => {
        throw new Error("something broke")
      })
    })

    expect(mockToast.error).toHaveBeenCalledWith("Oops", {
      description: "something broke",
    })
  })

  it("error calls logger.error", async () => {
    const error = new Error("test error")
    const logContext = { action: "test" }
    const { result } = renderHook(() =>
      useAsyncHandler({
        errorMessage: "Failed",
        logContext,
      })
    )

    await act(async () => {
      await result.current.execute(async () => {
        throw error
      })
    })

    expect(mockLogger.error).toHaveBeenCalledWith("Failed", error, logContext)
  })

  it("error returns undefined", async () => {
    const { result } = renderHook(() => useAsyncHandler())

    let value: unknown
    await act(async () => {
      value = await result.current.execute(async () => {
        throw new Error("fail")
      })
    })

    expect(value).toBeUndefined()
  })
})
