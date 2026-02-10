import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4")
  })

  it("should handle conditional classes", () => {
    expect(cn("px-2", true && "py-2", false && "m-2")).toBe("px-2 py-2")
  })

  it("should return empty string with no arguments", () => {
    expect(cn()).toBe("")
  })

  it("should filter out falsy values", () => {
    expect(cn(undefined, null, false, "px-2")).toBe("px-2")
  })

  it("should handle object syntax", () => {
    expect(cn({ "px-2": true, "py-2": false })).toBe("px-2")
  })

  it("should resolve tailwind conflicts keeping last value", () => {
    expect(cn("p-2 p-4")).toBe("p-4")
  })
})
