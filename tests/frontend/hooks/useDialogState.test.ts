import { renderHook, act } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useDialogState } from "@/hooks/useDialogState"

describe("useDialogState", () => {
  it("starts closed by default", () => {
    const { result } = renderHook(() => useDialogState())

    expect(result.current.isOpen).toBe(false)
  })

  it("starts open with initialOpen=true", () => {
    const { result } = renderHook(() => useDialogState(true))

    expect(result.current.isOpen).toBe(true)
  })

  it("open() sets isOpen to true", () => {
    const { result } = renderHook(() => useDialogState())

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it("close() sets isOpen to false", () => {
    const { result } = renderHook(() => useDialogState(true))

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it("toggle() flips state both directions", () => {
    const { result } = renderHook(() => useDialogState())

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it("setOpen(true) and setOpen(false) work", () => {
    const { result } = renderHook(() => useDialogState())

    act(() => {
      result.current.setOpen(true)
    })

    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.setOpen(false)
    })

    expect(result.current.isOpen).toBe(false)
  })

  it("isPending starts as false", () => {
    const { result } = renderHook(() => useDialogState())

    expect(result.current.isPending).toBe(false)
  })
})
