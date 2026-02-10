import { describe, expect, it } from "vitest"
import {
  getVideoDisplayInfo,
  aspectRatioToCSS,
  getOptimalDisplayRatio,
} from "@/lib/calculators/video-display-info"
import type { BunnyVideoGetResponse } from "@/types"

/**
 * Helper to create a minimal BunnyVideoGetResponse with width, height, rotation.
 */
const makeVideo = (
  width: number,
  height: number,
  rotation: number
): BunnyVideoGetResponse =>
  ({ width, height, rotation }) as unknown as BunnyVideoGetResponse

// ============================================
// getVideoDisplayInfo
// ============================================

describe("getVideoDisplayInfo", () => {
  it("should detect 16:9 landscape (1920x1080, rotation 0)", () => {
    const info = getVideoDisplayInfo(makeVideo(1920, 1080, 0))
    expect(info.aspectRatio).toBe("16:9")
    expect(info.isLandscape).toBe(true)
    expect(info.isPortrait).toBe(false)
  })

  it("should detect 9:16 portrait (1080x1920, rotation 0)", () => {
    const info = getVideoDisplayInfo(makeVideo(1080, 1920, 0))
    expect(info.aspectRatio).toBe("9:16")
    expect(info.isPortrait).toBe(true)
    expect(info.isLandscape).toBe(false)
  })

  it("should detect 1:1 square (1080x1080, rotation 0)", () => {
    const info = getVideoDisplayInfo(makeVideo(1080, 1080, 0))
    expect(info.aspectRatio).toBe("1:1")
    expect(info.isPortrait).toBe(false)
    expect(info.isLandscape).toBe(false)
  })

  it("should detect 4:3 landscape (640x480, rotation 0)", () => {
    const info = getVideoDisplayInfo(makeVideo(640, 480, 0))
    expect(info.aspectRatio).toBe("4:3")
    expect(info.isLandscape).toBe(true)
  })

  it("should detect 3:4 portrait (480x640, rotation 0)", () => {
    const info = getVideoDisplayInfo(makeVideo(480, 640, 0))
    expect(info.aspectRatio).toBe("3:4")
    expect(info.isPortrait).toBe(true)
  })

  it("should detect 21:9 ultra-wide (2520x1080, rotation 0)", () => {
    const info = getVideoDisplayInfo(makeVideo(2520, 1080, 0))
    expect(info.aspectRatio).toBe("21:9")
    expect(info.isLandscape).toBe(true)
  })

  it('should return "custom" for non-standard ratios (1000x700, rotation 0)', () => {
    const info = getVideoDisplayInfo(makeVideo(1000, 700, 0))
    expect(info.aspectRatio).toBe("custom")
  })

  it("should swap dimensions with rotation 90 (1080x1920 becomes landscape 16:9)", () => {
    const info = getVideoDisplayInfo(makeVideo(1080, 1920, 90))
    // After rotation: displayWidth=1920, displayHeight=1080
    expect(info.aspectRatio).toBe("16:9")
    expect(info.isLandscape).toBe(true)
    expect(info.isPortrait).toBe(false)
  })

  it("should swap dimensions with rotation -90 (1920x1080 becomes portrait 9:16)", () => {
    const info = getVideoDisplayInfo(makeVideo(1920, 1080, -90))
    // After rotation: displayWidth=1080, displayHeight=1920
    expect(info.aspectRatio).toBe("9:16")
    expect(info.isPortrait).toBe(true)
    expect(info.isLandscape).toBe(false)
  })
})

// ============================================
// aspectRatioToCSS
// ============================================

describe("aspectRatioToCSS", () => {
  it('should convert "16:9" to "16 / 9"', () => {
    expect(aspectRatioToCSS("16:9")).toBe("16 / 9")
  })

  it('should convert "9:16" to "9 / 16"', () => {
    expect(aspectRatioToCSS("9:16")).toBe("9 / 16")
  })

  it('should convert "1:1" to "1 / 1"', () => {
    expect(aspectRatioToCSS("1:1")).toBe("1 / 1")
  })

  it('should convert "4:3" to "4 / 3"', () => {
    expect(aspectRatioToCSS("4:3")).toBe("4 / 3")
  })

  it('should convert "3:4" to "3 / 4"', () => {
    expect(aspectRatioToCSS("3:4")).toBe("3 / 4")
  })

  it('should convert "21:9" to "21 / 9"', () => {
    expect(aspectRatioToCSS("21:9")).toBe("21 / 9")
  })

  it('should fallback "custom" to "16 / 9"', () => {
    expect(aspectRatioToCSS("custom")).toBe("16 / 9")
  })
})

// ============================================
// getOptimalDisplayRatio
// ============================================

describe("getOptimalDisplayRatio", () => {
  it('should return "9 / 16" for portrait 9:16 video', () => {
    const info = getVideoDisplayInfo(makeVideo(1080, 1920, 0))
    expect(getOptimalDisplayRatio(info)).toBe("9 / 16")
  })

  it('should return "3 / 4" for portrait 3:4 video', () => {
    const info = getVideoDisplayInfo(makeVideo(480, 640, 0))
    expect(getOptimalDisplayRatio(info)).toBe("3 / 4")
  })

  it('should return "16 / 9" for landscape 16:9 video', () => {
    const info = getVideoDisplayInfo(makeVideo(1920, 1080, 0))
    expect(getOptimalDisplayRatio(info)).toBe("16 / 9")
  })
})
