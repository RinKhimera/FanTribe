import { describe, expect, it } from "vitest"
import { profileFormSchema } from "@/schemas/profile"

const validProfile = {
  displayName: "Samuel Doe",
  username: "samueldoe",
  bio: "Hello, I am a creator on FanTribe.",
  location: "Douala, Cameroon",
  socialLinks: [{ url: "https://twitter.com/samueldoe" }],
}

describe("profileFormSchema", () => {
  it("should pass with a valid full profile", () => {
    const result = profileFormSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
  })

  it("should fail when displayName is too short (2 chars)", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      displayName: "ab",
    })
    expect(result.success).toBe(false)
  })

  it("should fail when displayName is too long (31 chars)", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      displayName: "a".repeat(31),
    })
    expect(result.success).toBe(false)
  })

  it("should fail when username is too short (5 chars)", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      username: "abcde",
    })
    expect(result.success).toBe(false)
  })

  it("should fail when username is too long (25 chars)", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      username: "a".repeat(25),
    })
    expect(result.success).toBe(false)
  })

  it("should fail when username contains uppercase letters", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      username: "SamuelDoe",
    })
    expect(result.success).toBe(false)
  })

  it("should fail when username contains special characters", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      username: "user@name",
    })
    expect(result.success).toBe(false)
  })

  it("should fail when username contains 2 underscores", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      username: "user__name",
    })
    expect(result.success).toBe(false)
  })

  it("should pass when username contains exactly 1 underscore", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      username: "samuel_doe",
    })
    expect(result.success).toBe(true)
  })

  it("should fail when bio is too short (3 chars)", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      bio: "abc",
    })
    expect(result.success).toBe(false)
  })

  it("should fail when bio is too long (151 chars)", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      bio: "a".repeat(151),
    })
    expect(result.success).toBe(false)
  })

  it("should fail when location is too short (1 char)", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      location: "a",
    })
    expect(result.success).toBe(false)
  })

  it("should fail when socialLinks has 6 items", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      socialLinks: Array.from({ length: 6 }, (_, i) => ({
        url: `https://example.com/${i}`,
      })),
    })
    expect(result.success).toBe(false)
  })

  it("should fail when socialLinks has duplicate URLs", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      socialLinks: [
        { url: "https://twitter.com/sam" },
        { url: "https://twitter.com/sam" },
      ],
    })
    expect(result.success).toBe(false)
  })
})
