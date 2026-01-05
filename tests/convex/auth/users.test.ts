import { convexTest } from "convex-test"
import { beforeEach, describe, expect, it } from "vitest"
import { api, internal } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("users", () => {
  beforeEach(() => {
    process.env.CLERK_APP_DOMAIN = "test-domain"
  })

  it("should upsert user from Clerk", async () => {
    const t = convexTest(schema)

    const clerkData = {
      id: "clerk_123",
      first_name: "John",
      last_name: "Doe",
      email_addresses: [{ email_address: "john@doe.com" }],
      image_url: "https://test.com/image.png",
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await t.mutation(internal.users.upsertFromClerk, { data: clerkData as any })

    const user = await t.run(async (ctx) => {
      return await ctx.db
        .query("users")
        .withIndex("by_externalId", (q) => q.eq("externalId", "clerk_123"))
        .unique()
    })

    expect(user).not.toBeNull()
    expect(user?.name).toBe("John Doe")
    expect(user?.tokenIdentifier).toBe("test-domain|clerk_123")
  })

  it("should get current user when authenticated", async () => {
    const t = convexTest(schema)

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        name: "Authenticated User",
        tokenIdentifier: "test-domain|clerk_123",
        accountType: "USER",
        email: "auth@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const authenticated = t.withIdentity({
      tokenIdentifier: "test-domain|clerk_123",
    })

    const user = await authenticated.query(api.users.getCurrentUser, {})
    expect(user).not.toBeNull()
    expect(user?.name).toBe("Authenticated User")
  })

  it("should return null for getCurrentUser when not authenticated", async () => {
    const t = convexTest(schema)
    const user = await t.query(api.users.getCurrentUser, {})
    expect(user).toBeNull()
  })
})
