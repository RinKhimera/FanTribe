import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { useScrollLock } from "@/hooks/useScrollLock"

describe("useScrollLock", () => {
  beforeEach(() => {
    document.body.style.overflow = ""
    document.body.style.paddingRight = ""
  })

  it("enabled=true sets body overflow to hidden", () => {
    renderHook(() => useScrollLock({ enabled: true }))

    expect(document.body.style.overflow).toBe("hidden")
  })

  it("enabled=false does not set overflow hidden", () => {
    renderHook(() => useScrollLock({ enabled: false }))

    expect(document.body.style.overflow).not.toBe("hidden")
  })

  it("unmount restores original styles", () => {
    document.body.style.overflow = "auto"

    const { unmount } = renderHook(() =>
      useScrollLock({ enabled: true })
    )

    expect(document.body.style.overflow).toBe("hidden")

    unmount()

    expect(document.body.style.overflow).toBe("auto")
  })

  it("toggling enabled restores styles", () => {
    const { rerender } = renderHook(
      ({ enabled }) => useScrollLock({ enabled }),
      { initialProps: { enabled: true } }
    )

    expect(document.body.style.overflow).toBe("hidden")

    rerender({ enabled: false })

    expect(document.body.style.overflow).not.toBe("hidden")
  })
})
