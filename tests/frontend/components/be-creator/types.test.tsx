import { describe, expect, it } from "vitest"
import { applicationSchema, motivationOptions } from "@/components/be-creator/types"

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

  describe("whatsappNumber", () => {
    it("should reject phone numbers with less than 9 digits", () => {
      const result = applicationSchema.shape.whatsappNumber.safeParse("12345678")
      expect(result.success).toBe(false)
    })

    it("should reject phone numbers with more than 9 digits", () => {
      const result =
        applicationSchema.shape.whatsappNumber.safeParse("1234567890")
      expect(result.success).toBe(false)
    })

    it("should reject phone numbers with non-digit characters", () => {
      const result = applicationSchema.shape.whatsappNumber.safeParse("12345678a")
      expect(result.success).toBe(false)
    })

    it("should accept exactly 9 digits", () => {
      const result = applicationSchema.shape.whatsappNumber.safeParse("123456789")
      expect(result.success).toBe(true)
    })
  })

  describe("mobileMoneyNumber", () => {
    it("should reject phone numbers with less than 9 digits", () => {
      const result =
        applicationSchema.shape.mobileMoneyNumber.safeParse("12345678")
      expect(result.success).toBe(false)
    })

    it("should reject phone numbers with more than 9 digits", () => {
      const result =
        applicationSchema.shape.mobileMoneyNumber.safeParse("1234567890")
      expect(result.success).toBe(false)
    })

    it("should accept exactly 9 digits", () => {
      const result =
        applicationSchema.shape.mobileMoneyNumber.safeParse("123456789")
      expect(result.success).toBe(true)
    })
  })

  describe("mobileMoneyNumber2", () => {
    it("should be optional", () => {
      const result = applicationSchema.shape.mobileMoneyNumber2.safeParse(
        undefined
      )
      expect(result.success).toBe(true)
    })

    it("should accept empty string", () => {
      const result = applicationSchema.shape.mobileMoneyNumber2.safeParse("")
      expect(result.success).toBe(true)
    })

    it("should accept exactly 9 digits when provided", () => {
      const result =
        applicationSchema.shape.mobileMoneyNumber2.safeParse("123456789")
      expect(result.success).toBe(true)
    })

    it("should reject invalid phone numbers when provided", () => {
      const result =
        applicationSchema.shape.mobileMoneyNumber2.safeParse("12345678")
      expect(result.success).toBe(false)
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
        "passion_partage",
        "expertise_professionnelle",
        "influence_communaute",
        "creativite_artistique",
        "business_entrepreneur",
        "education_formation",
        "lifestyle_personnel",
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

    it("should reject removed 'monetisation' value", () => {
      const result =
        applicationSchema.shape.applicationReason.safeParse("monetisation")
      expect(result.success).toBe(false)
    })
  })
})

describe("motivationOptions", () => {
  it("should have exactly 8 options", () => {
    expect(motivationOptions).toHaveLength(8)
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

  it("should not include monetisation option", () => {
    const values = motivationOptions.map((option) => option.value)
    expect(values).not.toContain("monetisation")
  })
})
