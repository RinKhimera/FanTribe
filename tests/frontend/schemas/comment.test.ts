import { describe, expect, it } from "vitest"
import { commentFormSchema } from "@/schemas/comment"

describe("commentFormSchema", () => {
  it("should pass with valid content", () => {
    const result = commentFormSchema.safeParse({ content: "Great post!" })
    expect(result.success).toBe(true)
  })

  it("should fail when content is too short (1 char)", () => {
    const result = commentFormSchema.safeParse({ content: "a" })
    expect(result.success).toBe(false)
  })

  it("should fail when content is too long (151 chars)", () => {
    const result = commentFormSchema.safeParse({ content: "a".repeat(151) })
    expect(result.success).toBe(false)
  })

  it("should fail with an empty string", () => {
    const result = commentFormSchema.safeParse({ content: "" })
    expect(result.success).toBe(false)
  })

  it("should pass at the boundary minimum (2 chars)", () => {
    const result = commentFormSchema.safeParse({ content: "ab" })
    expect(result.success).toBe(true)
  })
})
