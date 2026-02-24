import { convexTest } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"
import {
  insertCreator,
  insertPost,
  insertUser,
} from "../../helpers/convex-setup"

describe("likes", () => {
  describe("likePost", () => {
    it("should like a post and return likeId", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { creatorId, postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { creatorId, userId, postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      const result = await user.mutation(api.likes.likePost, { postId })

      expect(result.liked).toBe(true)
      expect(result.likeId).toBeDefined()
      expect(result.already).toBeUndefined()

      // Verify like was inserted
      const likes = await t.run(async (ctx) => {
        return await ctx.db
          .query("likes")
          .withIndex("by_post", (q) => q.eq("postId", postId))
          .collect()
      })
      expect(likes).toHaveLength(1)

      // Verify notification was created
      const notifications = await t.run(async (ctx) => {
        return await ctx.db.query("notifications").collect()
      })
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe("like")
      expect(notifications[0].recipientId).toBe(creatorId)
    })

    it("should be idempotent when liking same post twice", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      const first = await user.mutation(api.likes.likePost, { postId })
      const second = await user.mutation(api.likes.likePost, { postId })

      expect(first.liked).toBe(true)
      expect(second.already).toBe(true)
      expect(second.likeId).toBe(first.likeId)

      // Only 1 like in DB
      const likes = await t.run(async (ctx) => {
        return await ctx.db
          .query("likes")
          .withIndex("by_post", (q) => q.eq("postId", postId))
          .collect()
      })
      expect(likes).toHaveLength(1)
    })

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      await expect(
        t.mutation(api.likes.likePost, { postId }),
      ).rejects.toThrow()
    })
  })

  describe("unlikePost", () => {
    it("should unlike a previously liked post", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.likes.likePost, { postId })

      const result = await user.mutation(api.likes.unlikePost, { postId })

      expect(result.removed).toBe(true)

      // Verify like was deleted
      const likes = await t.run(async (ctx) => {
        return await ctx.db
          .query("likes")
          .withIndex("by_post", (q) => q.eq("postId", postId))
          .collect()
      })
      expect(likes).toHaveLength(0)
    })

    it("should return removed: false when post was not liked", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      const result = await user.mutation(api.likes.unlikePost, { postId })

      expect(result.removed).toBe(false)
      expect(result.reason).toBe("Not liked")
    })

    it("should decrement stats and remove notification actor", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { postId, creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId, creatorId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.likes.likePost, { postId })

      // Verify notification exists
      const before = await t.run(async (ctx) => {
        return await ctx.db.query("notifications").collect()
      })
      expect(before).toHaveLength(1)

      await user.mutation(api.likes.unlikePost, { postId })

      // Notification should be removed (last actor was removed)
      const after = await t.run(async (ctx) => {
        return await ctx.db.query("notifications").collect()
      })
      expect(after).toHaveLength(0)

      // Stats should have been decremented
      const stats = await t.run(async (ctx) => {
        return await ctx.db
          .query("userStats")
          .withIndex("by_userId", (q) => q.eq("userId", creatorId))
          .unique()
      })
      if (stats) {
        expect(stats.totalLikes).toBe(0)
      }
    })
  })

  describe("countLikes", () => {
    it("should return correct count for a post", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx, {
          tokenIdentifier: "user1_id",
          email: "u1@test.com",
          externalId: "ext_u1",
        })
        await insertUser(ctx, {
          tokenIdentifier: "user2_id",
          email: "u2@test.com",
          externalId: "ext_u2",
        })
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const u1 = t.withIdentity({ tokenIdentifier: "user1_id" })
      const u2 = t.withIdentity({ tokenIdentifier: "user2_id" })
      await u1.mutation(api.likes.likePost, { postId })
      await u2.mutation(api.likes.likePost, { postId })

      const result = await t.query(api.likes.countLikes, { postId })
      expect(result.count).toBe(2)
      expect(result.postId).toBe(postId)
    })

    it("should return 0 for a post with no likes", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const result = await t.query(api.likes.countLikes, { postId })
      expect(result.count).toBe(0)
    })
  })

  describe("isLiked", () => {
    it("should return true when user has liked the post", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.likes.likePost, { postId })

      const result = await user.query(api.likes.isLiked, { postId })
      expect(result.liked).toBe(true)
    })

    it("should return false when user has not liked the post", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      const result = await user.query(api.likes.isLiked, { postId })
      expect(result.liked).toBe(false)
    })
  })

  describe("getPostLikes", () => {
    it("should return likes with enriched user data", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.likes.likePost, { postId })

      const result = await t.query(api.likes.getPostLikes, { postId })
      expect(result).toHaveLength(1)
      expect(result[0]._id).toBeDefined()
      expect(result[0].user).toBeDefined()
      expect(result[0].user!.name).toBe("Test User")
    })
  })
})
