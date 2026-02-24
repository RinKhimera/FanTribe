import { renderHook, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation"

const createKeyEvent = (key: string) =>
  ({ key, preventDefault: vi.fn() }) as unknown as React.KeyboardEvent

describe("useKeyboardNavigation", () => {
  const items = ["apple", "banana", "cherry"]
  const defaultOptions = {
    items,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    isOpen: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("ArrowDown increments selectedIndex", () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(defaultOptions)
    )

    expect(result.current.selectedIndex).toBe(-1)

    act(() => {
      result.current.handleKeyDown(createKeyEvent("ArrowDown"))
    })

    expect(result.current.selectedIndex).toBe(0)
  })

  it("ArrowDown stops at last item", () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(defaultOptions)
    )

    act(() => {
      result.current.handleKeyDown(createKeyEvent("ArrowDown"))
      result.current.handleKeyDown(createKeyEvent("ArrowDown"))
      result.current.handleKeyDown(createKeyEvent("ArrowDown"))
      result.current.handleKeyDown(createKeyEvent("ArrowDown"))
    })

    expect(result.current.selectedIndex).toBe(2)
  })

  it("ArrowUp decrements selectedIndex", () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(defaultOptions)
    )

    act(() => {
      result.current.setSelectedIndex(1)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent("ArrowUp"))
    })

    expect(result.current.selectedIndex).toBe(0)
  })

  it("ArrowUp from 0 goes to -1", () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(defaultOptions)
    )

    act(() => {
      result.current.setSelectedIndex(0)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent("ArrowUp"))
    })

    expect(result.current.selectedIndex).toBe(-1)
  })

  it("Enter calls onSelect with selected item", () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({ ...defaultOptions, onSelect })
    )

    act(() => {
      result.current.setSelectedIndex(1)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent("Enter"))
    })

    expect(onSelect).toHaveBeenCalledWith("banana")
  })

  it("Enter does nothing when selectedIndex is -1", () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({ ...defaultOptions, onSelect })
    )

    act(() => {
      result.current.handleKeyDown(createKeyEvent("Enter"))
    })

    expect(onSelect).not.toHaveBeenCalled()
  })

  it("Escape calls onClose and resets to -1", () => {
    const onClose = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({ ...defaultOptions, onClose })
    )

    act(() => {
      result.current.setSelectedIndex(2)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent("Escape"))
    })

    expect(onClose).toHaveBeenCalled()
    expect(result.current.selectedIndex).toBe(-1)
  })

  it("does nothing when isOpen is false", () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({ ...defaultOptions, onSelect, isOpen: false })
    )

    act(() => {
      result.current.handleKeyDown(createKeyEvent("ArrowDown"))
    })

    expect(result.current.selectedIndex).toBe(-1)
  })
})
