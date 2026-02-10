import { describe, expect, it } from "vitest"
import {
  convertCurrency,
  formatCurrency,
  formatDualCurrency,
} from "@/lib/formatters/currency/format-currency"

// ============================================
// convertCurrency
// ============================================

describe("convertCurrency", () => {
  it("should convert USD to XAF using rate 562.2", () => {
    expect(convertCurrency(5, "USD", "XAF")).toBe(2811)
  })

  it("should convert XAF to USD using rate 562.2", () => {
    expect(convertCurrency(2811, "XAF", "USD")).toBeCloseTo(5, 1)
  })

  it("should return the same amount when currencies are identical", () => {
    expect(convertCurrency(100, "USD", "USD")).toBe(100)
    expect(convertCurrency(5000, "XAF", "XAF")).toBe(5000)
  })

  it("should return 0 when amount is 0", () => {
    expect(convertCurrency(0, "USD", "XAF")).toBe(0)
    expect(convertCurrency(0, "XAF", "USD")).toBe(0)
  })
})

// ============================================
// formatCurrency
// ============================================

describe("formatCurrency", () => {
  it("should format USD amounts with dollar sign", () => {
    const result = formatCurrency(5, "USD")
    expect(result).toContain("5.00")
    expect(result).toContain("$")
  })

  it("should format XAF amounts with FCFA suffix", () => {
    const result = formatCurrency(2811, "XAF")
    expect(result).toContain("FCFA")
  })

  it("should format zero USD", () => {
    const result = formatCurrency(0, "USD")
    expect(result).toContain("$")
    expect(result).toContain("0.00")
  })

  it("should format zero XAF", () => {
    const result = formatCurrency(0, "XAF")
    expect(result).toContain("FCFA")
    expect(result).toContain("0")
  })

  it("should format large USD amounts", () => {
    const result = formatCurrency(1234567.89, "USD")
    expect(result).toContain("$")
  })

  it("should format large XAF amounts", () => {
    const result = formatCurrency(1000000, "XAF")
    expect(result).toContain("FCFA")
    expect(result).toContain("000")
  })
})

// ============================================
// formatDualCurrency
// ============================================

describe("formatDualCurrency", () => {
  it("should show both FCFA and $ when original is XAF", () => {
    const result = formatDualCurrency(2811, "XAF")
    expect(result).toContain("FCFA")
    expect(result).toContain("$")
  })

  it("should show both $ and FCFA when original is USD", () => {
    const result = formatDualCurrency(5, "USD")
    expect(result).toContain("$")
    expect(result).toContain("FCFA")
  })

  it("should not show conversion when showConversion is false", () => {
    const result = formatDualCurrency(2811, "XAF", false)
    expect(result).toContain("FCFA")
    expect(result).not.toContain("(")
    expect(result).not.toContain("$")
  })

  it("should handle zero amount with dual currency", () => {
    const result = formatDualCurrency(0, "XAF")
    expect(result).toContain("FCFA")
    expect(result).toContain("$")
    expect(result).toContain("0")
  })

  it("should wrap converted amount in parentheses with tilde", () => {
    const result = formatDualCurrency(5, "USD")
    expect(result).toMatch(/\(~.+\)/)
  })

  it("should not show parentheses when showConversion is false for USD", () => {
    const result = formatDualCurrency(5, "USD", false)
    expect(result).toContain("$")
    expect(result).not.toContain("(")
    expect(result).not.toContain("FCFA")
  })
})
