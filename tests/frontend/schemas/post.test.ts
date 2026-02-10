import { describe, expect, it } from "vitest"
import { postFormSchema } from "@/schemas/post"

describe("postFormSchema", () => {
  it("should pass with valid content and empty media", () => {
    const result = postFormSchema.safeParse({
      content: "Test post content",
      media: [],
    })
    expect(result.success).toBe(true)
  })

  it("should fail when content is too short (3 chars)", () => {
    const result = postFormSchema.safeParse({
      content: "abc",
      media: [],
    })
    expect(result.success).toBe(false)
  })

  it("should fail when content is too long (401 chars)", () => {
    const result = postFormSchema.safeParse({
      content: "a".repeat(401),
      media: [],
    })
    expect(result.success).toBe(false)
  })

  it("should pass with valid media URLs", () => {
    const result = postFormSchema.safeParse({
      content: "Test post",
      media: ["https://example.com/img.jpg"],
    })
    expect(result.success).toBe(true)
  })

  it("should fail with an invalid media URL", () => {
    const result = postFormSchema.safeParse({
      content: "Test post",
      media: ["not-a-url"],
    })
    expect(result.success).toBe(false)
  })

  it("should fail with an empty content string", () => {
    const result = postFormSchema.safeParse({
      content: "",
      media: [],
    })
    expect(result.success).toBe(false)
  })
})
