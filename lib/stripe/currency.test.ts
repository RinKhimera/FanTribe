import { describe, expect, it } from "vitest"
import {
  convertStripeAmount,
  isZeroDecimalCurrency,
  ZERO_DECIMAL_CURRENCIES,
} from "./currency"

describe("isZeroDecimalCurrency", () => {
  it("should return true for zero-decimal currencies", () => {
    expect(isZeroDecimalCurrency("XAF")).toBe(true)
    expect(isZeroDecimalCurrency("JPY")).toBe(true)
    expect(isZeroDecimalCurrency("KRW")).toBe(true)
    expect(isZeroDecimalCurrency("XOF")).toBe(true)
  })

  it("should return false for standard currencies", () => {
    expect(isZeroDecimalCurrency("USD")).toBe(false)
    expect(isZeroDecimalCurrency("EUR")).toBe(false)
    expect(isZeroDecimalCurrency("GBP")).toBe(false)
    expect(isZeroDecimalCurrency("CAD")).toBe(false)
  })

  it("should be case-insensitive", () => {
    expect(isZeroDecimalCurrency("xaf")).toBe(true)
    expect(isZeroDecimalCurrency("Xaf")).toBe(true)
    expect(isZeroDecimalCurrency("usd")).toBe(false)
    expect(isZeroDecimalCurrency("Usd")).toBe(false)
  })
})

describe("convertStripeAmount", () => {
  describe("zero-decimal currencies", () => {
    it("should not divide XAF amounts", () => {
      expect(convertStripeAmount(1000, "XAF")).toBe(1000)
      expect(convertStripeAmount(5000, "XAF")).toBe(5000)
    })

    it("should not divide JPY amounts", () => {
      expect(convertStripeAmount(500, "JPY")).toBe(500)
      expect(convertStripeAmount(10000, "JPY")).toBe(10000)
    })

    it("should not divide KRW amounts", () => {
      expect(convertStripeAmount(50000, "KRW")).toBe(50000)
    })

    it("should handle all zero-decimal currencies", () => {
      for (const currency of ZERO_DECIMAL_CURRENCIES) {
        expect(convertStripeAmount(1000, currency)).toBe(1000)
      }
    })
  })

  describe("standard currencies", () => {
    it("should divide USD amounts by 100", () => {
      expect(convertStripeAmount(500, "USD")).toBe(5)
      expect(convertStripeAmount(1000, "USD")).toBe(10)
      expect(convertStripeAmount(999, "USD")).toBe(9.99)
    })

    it("should divide EUR amounts by 100", () => {
      expect(convertStripeAmount(500, "EUR")).toBe(5)
      expect(convertStripeAmount(1250, "EUR")).toBe(12.5)
    })

    it("should divide GBP amounts by 100", () => {
      expect(convertStripeAmount(799, "GBP")).toBe(7.99)
    })
  })

  describe("edge cases", () => {
    it("should return 0 for null amount", () => {
      expect(convertStripeAmount(null, "USD")).toBe(0)
      expect(convertStripeAmount(null, "XAF")).toBe(0)
    })

    it("should return 0 for undefined amount", () => {
      expect(convertStripeAmount(undefined, "USD")).toBe(0)
      expect(convertStripeAmount(undefined, "XAF")).toBe(0)
    })

    it("should default to USD when currency is null", () => {
      expect(convertStripeAmount(500, null)).toBe(5) // USD behavior
    })

    it("should default to USD when currency is undefined", () => {
      expect(convertStripeAmount(500, undefined)).toBe(5) // USD behavior
    })

    it("should be case-insensitive for currency codes", () => {
      expect(convertStripeAmount(1000, "xaf")).toBe(1000)
      expect(convertStripeAmount(1000, "Xaf")).toBe(1000)
      expect(convertStripeAmount(500, "usd")).toBe(5)
      expect(convertStripeAmount(500, "Usd")).toBe(5)
    })

    it("should handle zero amount", () => {
      expect(convertStripeAmount(0, "USD")).toBe(0)
      expect(convertStripeAmount(0, "XAF")).toBe(0)
    })
  })
})
