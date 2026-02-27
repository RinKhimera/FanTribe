import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("visibility", () => {
  it("should hide subscribers_only posts from non-subscribers in getHomePosts", async () => {
    const t = convexTest(schema)

    const creatorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "creator_id",
        accountType: "CREATOR",
        email: "creator@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const viewerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Viewer",
        tokenIdentifier: "viewer_id",
        accountType: "USER",
        email: "viewer@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    // Create a public post, a subscribers_only post, and a follow
    await t.run(async (ctx) => {
      await ctx.db.insert("posts", {
        author: creatorId,
        content: "Public Post",
        visibility: "public",
        medias: [],
      })
      await ctx.db.insert("posts", {
        author: creatorId,
        content: "Private Post",
        visibility: "subscribers_only",
        medias: [],
      })
      await ctx.db.insert("follows", {
        followerId: viewerId,
        followingId: creatorId,
      })
    })

    const viewer = t.withIdentity({ tokenIdentifier: "viewer_id" })
    const result = await viewer.query(api.posts.getHomePosts, {
      paginationOpts: { numItems: 20, cursor: null },
    })

    expect(result.page).toHaveLength(1)
    expect(result.page[0].content).toBe("Public Post")
  })

  it("should show subscribers_only posts to active subscribers in getHomePosts", async () => {
    const t = convexTest(schema)

    const creatorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "creator_id",
        accountType: "CREATOR",
        email: "creator@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const subscriberId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "subscriber_id",
        accountType: "USER",
        email: "sub@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    // Create active subscription + follow
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        creator: creatorId,
        subscriber: subscriberId,
        status: "active",
        type: "content_access",
        startDate: Date.now(),
        endDate: Date.now() + 100000,
        amountPaid: 1000,
        currency: "XAF",
        renewalCount: 0,
        lastUpdateTime: Date.now(),
      })
      await ctx.db.insert("follows", {
        followerId: subscriberId,
        followingId: creatorId,
      })

      await ctx.db.insert("posts", {
        author: creatorId,
        content: "Private Post",
        visibility: "subscribers_only",
        medias: [],
      })
    })

    const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
    const result = await subscriber.query(api.posts.getHomePosts, {
      paginationOpts: { numItems: 20, cursor: null },
    })

    expect(result.page).toHaveLength(1)
    expect(result.page[0].content).toBe("Private Post")
  })

  it("should show all posts to SUPERUSER in getHomePosts", async () => {
    const t = convexTest(schema)

    const creatorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "creator_id",
        accountType: "CREATOR",
        email: "creator@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Admin",
        tokenIdentifier: "admin_id",
        accountType: "SUPERUSER",
        email: "admin@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    await t.run(async (ctx) => {
      await ctx.db.insert("posts", {
        author: creatorId,
        content: "Private Post",
        visibility: "subscribers_only",
        medias: [],
      })
    })

    const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
    const result = await admin.query(api.posts.getHomePosts, {
      paginationOpts: { numItems: 20, cursor: null },
    })

    expect(result.page).toHaveLength(1)
    expect(result.page[0].content).toBe("Private Post")
  })
})
