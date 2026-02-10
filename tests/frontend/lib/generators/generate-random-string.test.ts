import { describe, expect, it } from "vitest"
import { generateRandomString } from "@/lib/generators/generate-random-string"

describe("generateRandomString", () => {
  it("should return a string of default length 6", () => {
    expect(generateRandomString()).toHaveLength(6)
  })

  it("should return a string of the specified length", () => {
    expect(generateRandomString(10)).toHaveLength(10)
  })

  it("should only contain alphanumeric characters", () => {
    const result = generateRandomString(50)
    expect(result).toMatch(/^[A-Za-z0-9]+$/)
  })

  it("should produce different results on successive calls", () => {
    const a = generateRandomString(20)
    const b = generateRandomString(20)
    expect(a).not.toBe(b)
  })
})
