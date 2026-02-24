import { renderHook, act } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useDebounce } from "@/hooks/useDebounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello"))

    expect(result.current).toBe("hello")
  })

  it("does not update during delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "hello" } }
    )

    rerender({ value: "world" })

    expect(result.current).toBe("hello")
  })

  it("updates after delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "hello" } }
    )

    rerender({ value: "world" })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("world")
  })

  it("resets timer on rapid value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "hello" } }
    )

    rerender({ value: "a" })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Timer reset: "a" hasn't appeared yet, still "hello"
    expect(result.current).toBe("hello")

    rerender({ value: "b" })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Only 200ms since "b" was set, still "hello"
    expect(result.current).toBe("hello")

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // 300ms since "b" was set, now it should be "b"
    expect(result.current).toBe("b")
  })

  it("supports custom delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "test", delay: 500 } }
    )

    rerender({ value: "updated", delay: 500 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Only 300ms passed, custom delay is 500ms
    expect(result.current).toBe("test")

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // 500ms passed, value should update
    expect(result.current).toBe("updated")
  })
})
