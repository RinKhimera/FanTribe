import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("blocks", () => {
  it("should block a user and verify with isBlocked", async () => {
    const t = convexTest(schema)

    const meId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Me",
        tokenIdentifier: "me_id",
        accountType: "USER",
        email: "me@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const targetId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Target",
        tokenIdentifier: "target_id",
        accountType: "USER",
        email: "target@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const me = t.withIdentity({ tokenIdentifier: "me_id" })

    // Block
    await me.mutation(api.blocks.blockUser, { targetUserId: targetId })

    // Check isBlocked
    const status = await me.query(api.blocks.isBlocked, {
      targetUserId: targetId,
    })
    expect(status.iBlocked).toBe(true)
    expect(status.any).toBe(true)

    const target = t.withIdentity({ tokenIdentifier: "target_id" })
    const statusForTarget = await target.query(api.blocks.isBlocked, {
      targetUserId: meId,
    })
    expect(statusForTarget.blockedMe).toBe(true)
    expect(statusForTarget.any).toBe(true)
  })

  it("should not notify blocked users when creating a post", async () => {
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

    const blockedUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Blocked",
        tokenIdentifier: "blocked_id",
        accountType: "USER",
        email: "blocked@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    // Creator blocks user
    await t.run(async (ctx) => {
      await ctx.db.insert("blocks", {
        blockerId: creatorId,
        blockedId: blockedUserId,
      })

      // User is subscribed
      await ctx.db.insert("subscriptions", {
        creator: creatorId,
        subscriber: blockedUserId,
        status: "active",
        type: "content_access",
        startDate: Date.now(),
        endDate: Date.now() + 100000,
        amountPaid: 1000,
        currency: "EUR",
        renewalCount: 0,
        lastUpdateTime: Date.now(),
      })
    })

    const creator = t.withIdentity({ tokenIdentifier: "creator_id" })
    await creator.mutation(api.posts.createPost, {
      content: "Post for non-blocked",
      medias: [],
      visibility: "subscribers_only",
    })

    const notifications = await t.run(async (ctx) => {
      return await ctx.db.query("notifications").collect()
    })

    expect(notifications).toHaveLength(0)
  })

  it("should filter out posts from blocked users in getHomePosts", async () => {
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

    // Viewer blocks Creator
    await t.run(async (ctx) => {
      await ctx.db.insert("blocks", {
        blockerId: viewerId,
        blockedId: creatorId,
      })

      await ctx.db.insert("posts", {
        author: creatorId,
        content: "Post from blocked creator",
        visibility: "public",
        medias: [],
      })
    })

    const viewer = t.withIdentity({ tokenIdentifier: "viewer_id" })
    const result = await viewer.query(api.posts.getHomePosts, {})

    // If this fails, it means getHomePosts doesn't filter blocked users
    expect(result.posts).toHaveLength(0)
  })
})
