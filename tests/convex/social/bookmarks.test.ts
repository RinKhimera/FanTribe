import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"
import {
  insertCreator,
  insertPost,
  insertUser,
} from "../../helpers/convex-setup"

describe("bookmarks", () => {
  describe("addBookmark", () => {
    it("should bookmark a post", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const result = await user.mutation(api.bookmarks.addBookmark, { postId })

      expect(result.added).toBe(true)
      expect(result.bookmarkId).toBeDefined()
      expect(result.already).toBeUndefined()
    })

    it("should be idempotent when bookmarking same post twice", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const first = await user.mutation(api.bookmarks.addBookmark, { postId })
      const second = await user.mutation(api.bookmarks.addBookmark, { postId })

      expect(first.added).toBe(true)
      expect(second.already).toBe(true)
      expect(second.bookmarkId).toBe(first.bookmarkId)
    })

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      await expect(
        t.mutation(api.bookmarks.addBookmark, { postId }),
      ).rejects.toThrow()
    })

    it("should reject non-existent post", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        await insertUser(ctx)
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      // Use a valid-looking but non-existent post ID
      const fakePostId = await t.run(async (ctx) => {
        const tempId = await ctx.db.insert("posts", {
          author: (await ctx.db.query("users").first())!._id,
          content: "temp",
          medias: [],
          visibility: "public",
        })
        await ctx.db.delete(tempId)
        return tempId
      })

      await expect(
        user.mutation(api.bookmarks.addBookmark, { postId: fakePostId }),
      ).rejects.toThrow("Post not found")
    })
  })

  describe("removeBookmark", () => {
    it("should remove an existing bookmark", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.bookmarks.addBookmark, { postId })

      const result = await user.mutation(api.bookmarks.removeBookmark, {
        postId,
      })
      expect(result.removed).toBe(true)

      // Verify bookmark was deleted
      const bookmarks = await t.run(async (ctx) => {
        return await ctx.db.query("bookmarks").collect()
      })
      expect(bookmarks).toHaveLength(0)
    })

    it("should return removed: false when not bookmarked", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      const result = await user.mutation(api.bookmarks.removeBookmark, {
        postId,
      })
      expect(result.removed).toBe(false)
      expect(result.reason).toBe("Not bookmarked")
    })
  })

  describe("getUserBookmarks", () => {
    it("should return user bookmarks with enriched posts", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, {
          author: creatorId,
          content: "Bookmarked post",
        })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.bookmarks.addBookmark, { postId })

      const result = await user.query(api.bookmarks.getUserBookmarks, {})

      expect(result.count).toBe(1)
      expect(result.posts).toHaveLength(1)
      expect(result.posts[0].content).toBe("Bookmarked post")
      expect(result.posts[0].author).toBeDefined()
      expect(result.posts[0].author.name).toBe("Test Creator")
    })

    it("should filter out deleted posts", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })

        // Bookmark then delete the post
        await ctx.db.insert("bookmarks", { userId, postId })
        await ctx.db.delete(postId)
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const result = await user.query(api.bookmarks.getUserBookmarks, {})

      expect(result.count).toBe(0)
      expect(result.posts).toHaveLength(0)
    })
  })

  describe("isBookmarked", () => {
    it("should return true for bookmarked post", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.bookmarks.addBookmark, { postId })

      const result = await user.query(api.bookmarks.isBookmarked, { postId })
      expect(result.bookmarked).toBe(true)
    })

    it("should return false for non-bookmarked post", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        const postId = await insertPost(ctx, { author: creatorId })
        return { postId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      const result = await user.query(api.bookmarks.isBookmarked, { postId })
      expect(result.bookmarked).toBe(false)
    })
  })

  describe("countBookmarks", () => {
    it("should return correct count", async () => {
      const t = convexTest(schema)

      const { postId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const u1 = await insertUser(ctx, {
          tokenIdentifier: "u1_id",
          email: "u1@test.com",
          externalId: "ext_u1",
        })
        const u2 = await insertUser(ctx, {
          tokenIdentifier: "u2_id",
          email: "u2@test.com",
          externalId: "ext_u2",
        })
        const postId = await insertPost(ctx, { author: creatorId })

        await ctx.db.insert("bookmarks", { userId: u1, postId })
        await ctx.db.insert("bookmarks", { userId: u2, postId })
        return { postId }
      })

      const result = await t.query(api.bookmarks.countBookmarks, { postId })
      expect(result.count).toBe(2)
      expect(result.postId).toBe(postId)
    })
  })
})
