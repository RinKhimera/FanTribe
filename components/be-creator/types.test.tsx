import { describe, expect, it } from "vitest"
import { applicationSchema, motivationOptions } from "./types"

describe("applicationSchema", () => {
  describe("fullName", () => {
    it("should reject names shorter than 2 characters", () => {
      const result = applicationSchema.shape.fullName.safeParse("A")
      expect(result.success).toBe(false)
    })

    it("should accept names with 2 or more characters", () => {
      const result = applicationSchema.shape.fullName.safeParse("Jo")
      expect(result.success).toBe(true)
    })
  })

  describe("phoneNumber", () => {
    it("should reject phone numbers with less than 9 digits", () => {
      const result = applicationSchema.shape.phoneNumber.safeParse("12345678")
      expect(result.success).toBe(false)
    })

    it("should reject phone numbers with more than 9 digits", () => {
      const result = applicationSchema.shape.phoneNumber.safeParse("1234567890")
      expect(result.success).toBe(false)
    })

    it("should reject phone numbers with non-digit characters", () => {
      const result = applicationSchema.shape.phoneNumber.safeParse("12345678a")
      expect(result.success).toBe(false)
    })

    it("should accept exactly 9 digits", () => {
      const result = applicationSchema.shape.phoneNumber.safeParse("123456789")
      expect(result.success).toBe(true)
    })
  })

  describe("address", () => {
    it("should reject addresses shorter than 10 characters", () => {
      const result = applicationSchema.shape.address.safeParse("Short")
      expect(result.success).toBe(false)
    })

    it("should accept addresses with 10 or more characters", () => {
      const result = applicationSchema.shape.address.safeParse("123 Main Street")
      expect(result.success).toBe(true)
    })
  })

  describe("applicationReason", () => {
    it("should accept valid enum values", () => {
      const validReasons = [
        "monetisation",
        "passion_partage",
        "expertise_professionnelle",
        "autre",
      ]

      validReasons.forEach((reason) => {
        const result = applicationSchema.shape.applicationReason.safeParse(reason)
        expect(result.success).toBe(true)
      })
    })

    it("should reject invalid enum values", () => {
      const result =
        applicationSchema.shape.applicationReason.safeParse("invalid_reason")
      expect(result.success).toBe(false)
    })
  })
})

describe("motivationOptions", () => {
  it("should have exactly 9 options", () => {
    expect(motivationOptions).toHaveLength(9)
  })

  it("should have 'autre' as the last option", () => {
    const lastOption = motivationOptions[motivationOptions.length - 1]
    expect(lastOption.value).toBe("autre")
  })

  it("should have all options with value, label, and description", () => {
    motivationOptions.forEach((option) => {
      expect(option).toHaveProperty("value")
      expect(option).toHaveProperty("label")
      expect(option).toHaveProperty("description")
      expect(typeof option.value).toBe("string")
      expect(typeof option.label).toBe("string")
      expect(typeof option.description).toBe("string")
    })
  })
})
