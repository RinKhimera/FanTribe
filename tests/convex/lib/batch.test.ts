import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "../../../convex/schema"
import { batchGetUsers, batchGetPosts, batchGetComments } from "../../../convex/lib/batch"

describe("batch helpers", () => {
  describe("batchGetUsers", () => {
    it("should fetch multiple users by IDs", async () => {
      const t = convexTest(schema)

      const userIds = await t.run(async (ctx) => {
        const id1 = await ctx.db.insert("users", {
          name: "User 1",
          tokenIdentifier: "user1_id",
          accountType: "USER",
          email: "user1@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        const id2 = await ctx.db.insert("users", {
          name: "User 2",
          tokenIdentifier: "user2_id",
          accountType: "CREATOR",
          email: "user2@test.com",
          image: "https://test.com/image.png",
          isOnline: false,
        })
        return [id1, id2]
      })

      // Run assertions inside t.run to avoid Map serialization issues
      const result = await t.run(async (ctx) => {
        const userMap = await batchGetUsers(ctx, userIds)
        return {
          size: userMap.size,
          user1Name: userMap.get(userIds[0])?.name,
          user2Name: userMap.get(userIds[1])?.name,
        }
      })

      expect(result.size).toBe(2)
      expect(result.user1Name).toBe("User 1")
      expect(result.user2Name).toBe("User 2")
    })

    it("should deduplicate IDs", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const result = await t.run(async (ctx) => {
        const userMap = await batchGetUsers(ctx, [userId, userId, userId])
        return {
          size: userMap.size,
          userName: userMap.get(userId)?.name,
        }
      })

      expect(result.size).toBe(1)
      expect(result.userName).toBe("User")
    })

    it("should handle non-existent IDs gracefully", async () => {
      const t = convexTest(schema)

      const existingId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Existing",
          tokenIdentifier: "existing_id",
          accountType: "USER",
          email: "existing@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const result = await t.run(async (ctx) => {
        const deletedId = await ctx.db.insert("users", {
          name: "Deleted",
          tokenIdentifier: "deleted_id",
          accountType: "USER",
          email: "deleted@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.delete(deletedId)

        const userMap = await batchGetUsers(ctx, [existingId, deletedId])
        return {
          size: userMap.size,
          existingName: userMap.get(existingId)?.name,
        }
      })

      expect(result.size).toBe(1)
      expect(result.existingName).toBe("Existing")
    })

    it("should return empty map for empty array", async () => {
      const t = convexTest(schema)

      const result = await t.run(async (ctx) => {
        const userMap = await batchGetUsers(ctx, [])
        return { size: userMap.size }
      })

      expect(result.size).toBe(0)
    })
  })

  describe("batchGetPosts", () => {
    it("should fetch multiple posts by IDs", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Author",
          tokenIdentifier: "author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postIds = await t.run(async (ctx) => {
        const id1 = await ctx.db.insert("posts", {
          author: userId,
          content: "Post 1",
          visibility: "public",
          medias: [],
        })
        const id2 = await ctx.db.insert("posts", {
          author: userId,
          content: "Post 2",
          visibility: "subscribers_only",
          medias: [],
        })
        return [id1, id2]
      })

      const result = await t.run(async (ctx) => {
        const postMap = await batchGetPosts(ctx, postIds)
        return {
          size: postMap.size,
          post1Content: postMap.get(postIds[0])?.content,
          post2Content: postMap.get(postIds[1])?.content,
        }
      })

      expect(result.size).toBe(2)
      expect(result.post1Content).toBe("Post 1")
      expect(result.post2Content).toBe("Post 2")
    })
  })

  describe("batchGetComments", () => {
    it("should fetch multiple comments by IDs", async () => {
      const t = convexTest(schema)

      const { userId, postId } = await t.run(async (ctx) => {
        const userId = await ctx.db.insert("users", {
          name: "Author",
          tokenIdentifier: "author_id",
          accountType: "USER",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        const postId = await ctx.db.insert("posts", {
          author: userId,
          content: "Post",
          visibility: "public",
          medias: [],
        })
        return { userId, postId }
      })

      const commentIds = await t.run(async (ctx) => {
        const id1 = await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Comment 1",
        })
        const id2 = await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Comment 2",
        })
        return [id1, id2]
      })

      const result = await t.run(async (ctx) => {
        const commentMap = await batchGetComments(ctx, commentIds)
        return {
          size: commentMap.size,
          comment1Content: commentMap.get(commentIds[0])?.content,
          comment2Content: commentMap.get(commentIds[1])?.content,
        }
      })

      expect(result.size).toBe(2)
      expect(result.comment1Content).toBe("Comment 1")
      expect(result.comment2Content).toBe("Comment 2")
    })
  })
})
