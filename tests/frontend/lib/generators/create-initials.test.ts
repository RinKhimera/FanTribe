import { describe, expect, it } from "vitest"
import { createInitials } from "@/lib/generators/create-initials"

describe("createInitials", () => {
  it('should return "JD" for "John Doe"', () => {
    expect(createInitials("John Doe")).toBe("JD")
  })

  it('should return "J" for a single word "John"', () => {
    expect(createInitials("John")).toBe("J")
  })

  it('should return "JCV" for "Jean Claude Van"', () => {
    expect(createInitials("Jean Claude Van")).toBe("JCV")
  })

  it('should return "XO" for an empty string', () => {
    expect(createInitials("")).toBe("XO")
  })

  it('should return "XO" for undefined', () => {
    expect(createInitials(undefined)).toBe("XO")
  })

  it("should uppercase lowercase initials", () => {
    expect(createInitials("jean doe")).toBe("JD")
  })
})
