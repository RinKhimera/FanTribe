import { convexTest } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("comments", () => {
  describe("addComment", () => {
    it("should create a comment and notification for a different user", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const authorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Post Author",
          tokenIdentifier: "author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Commenter",
          tokenIdentifier: "commenter_id",
          accountType: "USER",
          email: "commenter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: authorId,
          content: "A post to comment on",
          visibility: "public",
          medias: [],
        })
      })

      const commenter = t.withIdentity({ tokenIdentifier: "commenter_id" })
      const result = await commenter.mutation(api.comments.addComment, {
        postId,
        content: "Great post!",
      })

      expect(result.commentId).toBeDefined()

      // Verify comment was created
      const comments = await t.run(async (ctx) => {
        return await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("post", postId))
          .collect()
      })
      expect(comments).toHaveLength(1)
      expect(comments[0].content).toBe("Great post!")

      // Verify notification was created for the post author
      const notifications = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", authorId))
          .collect()
      })
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe("comment")
      expect(notifications[0].post).toBe(postId)
    })

    it("should not create notification when commenting on own post", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const authorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Author",
          tokenIdentifier: "author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: authorId,
          content: "My own post",
          visibility: "public",
          medias: [],
        })
      })

      const author = t.withIdentity({ tokenIdentifier: "author_id" })
      await author.mutation(api.comments.addComment, {
        postId,
        content: "Commenting on my own post",
      })

      // Verify no notification was created
      const notifications = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", authorId))
          .collect()
      })
      expect(notifications).toHaveLength(0)
    })

    it("should reject empty content", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const authorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Author",
          tokenIdentifier: "author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: authorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const author = t.withIdentity({ tokenIdentifier: "author_id" })
      await expect(
        author.mutation(api.comments.addComment, {
          postId,
          content: "   ",
        }),
      ).rejects.toThrow("Empty content")
    })

    it("should reject comment on nonexistent post", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

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

      // Create and delete a post to get a valid but nonexistent ID
      const postId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("posts", {
          author: userId,
          content: "Temp",
          visibility: "public",
          medias: [],
        })
        await ctx.db.delete(id)
        return id
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      await expect(
        user.mutation(api.comments.addComment, {
          postId,
          content: "Comment on deleted post",
        }),
      ).rejects.toThrow("Post not found")
    })

    it("should reject unauthenticated user", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const authorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Author",
          tokenIdentifier: "author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: authorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      await expect(
        t.mutation(api.comments.addComment, {
          postId,
          content: "Unauthorized comment",
        }),
      ).rejects.toThrow()
    })
  })

  describe("deleteComment", () => {
    it("should allow the comment author to delete their comment", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const postAuthorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Post Author",
          tokenIdentifier: "post_author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const commenterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Commenter",
          tokenIdentifier: "commenter_id",
          accountType: "USER",
          email: "commenter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: postAuthorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      // Create comment directly in DB
      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: commenterId,
          post: postId,
          content: "A comment to delete",
        })
      })

      const commenter = t.withIdentity({ tokenIdentifier: "commenter_id" })
      const result = await commenter.mutation(api.comments.deleteComment, {
        commentId,
      })

      expect(result.deleted).toBe(true)

      // Verify comment was deleted
      const comment = await t.run(async (ctx) => await ctx.db.get(commentId))
      expect(comment).toBeNull()
    })

    it("should allow the post owner to delete any comment on their post", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const postAuthorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Post Author",
          tokenIdentifier: "post_author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const commenterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Commenter",
          tokenIdentifier: "commenter_id",
          accountType: "USER",
          email: "commenter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: postAuthorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: commenterId,
          post: postId,
          content: "Comment by someone else",
        })
      })

      // Post author deletes the comment
      const postAuthor = t.withIdentity({ tokenIdentifier: "post_author_id" })
      const result = await postAuthor.mutation(api.comments.deleteComment, {
        commentId,
      })

      expect(result.deleted).toBe(true)

      const comment = await t.run(async (ctx) => await ctx.db.get(commentId))
      expect(comment).toBeNull()
    })

    it("should reject delete from a user who is neither comment author nor post owner", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const postAuthorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Post Author",
          tokenIdentifier: "post_author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const commenterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Commenter",
          tokenIdentifier: "commenter_id",
          accountType: "USER",
          email: "commenter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Random User",
          tokenIdentifier: "random_id",
          accountType: "USER",
          email: "random@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: postAuthorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: commenterId,
          post: postId,
          content: "A comment",
        })
      })

      const random = t.withIdentity({ tokenIdentifier: "random_id" })
      await expect(
        random.mutation(api.comments.deleteComment, { commentId }),
      ).rejects.toThrow("Not authorized")
    })

    it("should reject unauthenticated user", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const authorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Author",
          tokenIdentifier: "author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: authorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: authorId,
          post: postId,
          content: "A comment",
        })
      })

      await expect(
        t.mutation(api.comments.deleteComment, { commentId }),
      ).rejects.toThrow()
    })

    it("should throw when comment does not exist", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

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

      // Create and delete a comment to get a valid but nonexistent ID
      const commentId = await t.run(async (ctx) => {
        const postId = await ctx.db.insert("posts", {
          author: userId,
          content: "Temp",
          visibility: "public",
          medias: [],
        })
        const id = await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Temp comment",
        })
        await ctx.db.delete(id)
        return id
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      await expect(
        user.mutation(api.comments.deleteComment, { commentId }),
      ).rejects.toThrow("Comment not found")
    })

    it("should also delete the associated notification", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const postAuthorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Post Author",
          tokenIdentifier: "post_author_id",
          accountType: "CREATOR",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Commenter",
          tokenIdentifier: "commenter_id",
          accountType: "USER",
          email: "commenter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: postAuthorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      // Add comment (creates notification)
      const commenter = t.withIdentity({ tokenIdentifier: "commenter_id" })
      const { commentId } = await commenter.mutation(api.comments.addComment, {
        postId,
        content: "Comment to be deleted",
      })

      // Verify notification exists
      const notificationsBefore = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", postAuthorId))
          .collect()
      })
      expect(notificationsBefore).toHaveLength(1)

      // Delete comment
      await commenter.mutation(api.comments.deleteComment, { commentId })

      // Verify notification was also deleted
      const notificationsAfter = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", postAuthorId))
          .collect()
      })
      expect(notificationsAfter).toHaveLength(0)
    })
  })

  describe("updateComment", () => {
    it("should allow the comment author to update their comment", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: userId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Original content",
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      const result = await user.mutation(api.comments.updateComment, {
        commentId,
        content: "Updated content",
      })

      expect(result.success).toBe(true)

      const updated = await t.run(async (ctx) => await ctx.db.get(commentId))
      expect(updated?.content).toBe("Updated content")
    })

    it("should reject update from non-author", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const authorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Author",
          tokenIdentifier: "author_id",
          accountType: "USER",
          email: "author@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Other",
          tokenIdentifier: "other_id",
          accountType: "USER",
          email: "other@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: authorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: authorId,
          post: postId,
          content: "Original content",
        })
      })

      const other = t.withIdentity({ tokenIdentifier: "other_id" })
      await expect(
        other.mutation(api.comments.updateComment, {
          commentId,
          content: "Hacked content",
        }),
      ).rejects.toThrow("Not authorized")
    })

    it("should reject empty content update", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: userId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Original content",
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      await expect(
        user.mutation(api.comments.updateComment, {
          commentId,
          content: "   ",
        }),
      ).rejects.toThrow("Empty content")
    })
  })

  describe("listPostComments", () => {
    it("should list all comments for a post with author info", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Commenter",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: userId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "First comment",
        })
        await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Second comment",
        })
      })

      // listPostComments is a public query (no auth required)
      const result = await t.query(api.comments.listPostComments, { postId })

      expect(result).toHaveLength(2)
      expect(result[0].author?.name).toBe("Commenter")
    })
  })

  describe("countForPost", () => {
    it("should return the correct comment count", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: userId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Comment 1",
        })
        await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Comment 2",
        })
        await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "Comment 3",
        })
      })

      const result = await t.query(api.comments.countForPost, { postId })

      expect(result.postId).toBe(postId)
      expect(result.count).toBe(3)
    })
  })
})
