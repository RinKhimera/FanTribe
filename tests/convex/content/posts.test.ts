import { convexTest } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("posts", () => {
  it("should create a post and notify active subscribers", async () => {
    const t = convexTest(schema)
    registerRateLimiter(t)

    const authorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Author",
        tokenIdentifier: "author_id",
        accountType: "CREATOR",
        email: "author@test.com",
        externalId: "ext_author",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const subId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "sub_id",
        accountType: "USER",
        email: "sub@test.com",
        externalId: "ext_sub",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    // Create active subscription
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        creator: authorId,
        subscriber: subId,
        status: "active",
        type: "content_access",
        startDate: Date.now(),
        endDate: Date.now() + 100000,
        amountPaid: 1000,
        currency: "XAF",
        renewalCount: 0,
        lastUpdateTime: Date.now(),
      })
    })

    const author = t.withIdentity({ tokenIdentifier: "author_id" })

    const result = await author.mutation(api.posts.createPost, {
      content: "New Post Content",
      medias: [],
      visibility: "subscribers_only",
    })

    expect(result.postId).toBeDefined()

    // Check notification
    const notifications = await t.run(async (ctx) => {
      return await ctx.db.query("notifications").collect()
    })

    expect(notifications).toHaveLength(1)
    expect(notifications[0].recipientId).toBe(subId)
    expect(notifications[0].type).toBe("newPost")
  })

  it("should not notify blocked users", async () => {
    const t = convexTest(schema)
    registerRateLimiter(t)

    const authorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Author",
        tokenIdentifier: "author_id",
        accountType: "CREATOR",
        email: "author@test.com",
        externalId: "ext_author",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const subId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "sub_id",
        accountType: "USER",
        email: "sub@test.com",
        externalId: "ext_sub",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    // Create active subscription
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        creator: authorId,
        subscriber: subId,
        status: "active",
        type: "content_access",
        startDate: Date.now(),
        endDate: Date.now() + 100000,
        amountPaid: 1000,
        currency: "XAF",
        renewalCount: 0,
        lastUpdateTime: Date.now(),
      })

      // Author blocks subscriber
      await ctx.db.insert("blocks", {
        blockerId: authorId,
        blockedId: subId,
      })
    })

    const author = t.withIdentity({ tokenIdentifier: "author_id" })

    await author.mutation(api.posts.createPost, {
      content: "New Post Content",
      medias: [],
      visibility: "subscribers_only",
    })

    // Check notification (should be 0)
    const notifications = await t.run(async (ctx) => {
      return await ctx.db.query("notifications").collect()
    })

    expect(notifications).toHaveLength(0)
  })

  it("should filter home posts based on visibility and subscriptions", async () => {
    const t = convexTest(schema)
    registerRateLimiter(t)

    const authorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Author",
        tokenIdentifier: "author_id",
        accountType: "CREATOR",
        email: "author@test.com",
        externalId: "ext_author",
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
        externalId: "ext_viewer",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    // Create posts
    await t.run(async (ctx) => {
      await ctx.db.insert("posts", {
        author: authorId,
        content: "Public Post",
        medias: [],
        visibility: "public",
      })
      await ctx.db.insert("posts", {
        author: authorId,
        content: "Sub Only Post",
        medias: [],
        visibility: "subscribers_only",
      })
    })

    const viewer = t.withIdentity({ tokenIdentifier: "viewer_id" })

    // Without subscription
    const result1 = await viewer.query(api.posts.getHomePosts, {
      paginationOpts: { numItems: 20, cursor: null },
    })
    expect(result1.page).toHaveLength(1)
    expect(result1.page[0].content).toBe("Public Post")

    // With subscription
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        creator: authorId,
        subscriber: viewerId,
        status: "active",
        type: "content_access",
        startDate: Date.now(),
        endDate: Date.now() + 100000,
        amountPaid: 1000,
        currency: "XAF",
        renewalCount: 0,
        lastUpdateTime: Date.now(),
      })
    })

    const result2 = await viewer.query(api.posts.getHomePosts, {
      paginationOpts: { numItems: 20, cursor: null },
    })
    expect(result2.page).toHaveLength(2)
  })
})
