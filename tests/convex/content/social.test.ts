import { convexTest } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("social", () => {
  it("should like a post and create a notification", async () => {
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

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Liker",
        tokenIdentifier: "liker_id",
        accountType: "USER",
        email: "liker@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const postId = await t.run(async (ctx) => {
      return await ctx.db.insert("posts", {
        author: authorId,
        content: "Post to like",
        visibility: "public",
        medias: [],
      })
    })

    const liker = t.withIdentity({ tokenIdentifier: "liker_id" })
    await liker.mutation(api.likes.likePost, { postId })

    const likes = await t.run(async (ctx) => {
      return await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .collect()
    })
    expect(likes).toHaveLength(1)

    const notifications = await t.run(async (ctx) => {
      return await ctx.db
        .query("notifications")
        .withIndex("by_recipient", (q) => q.eq("recipientId", authorId))
        .collect()
    })
    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe("like")
  })

  it("should comment on a post and create a notification", async () => {
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
        content: "Post to comment",
        visibility: "public",
        medias: [],
      })
    })

    const commenter = t.withIdentity({ tokenIdentifier: "commenter_id" })
    await commenter.mutation(api.comments.addComment, {
      postId,
      content: "Nice post!",
    })

    const comments = await t.run(async (ctx) => {
      return await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("post", postId))
        .collect()
    })
    expect(comments).toHaveLength(1)

    const notifications = await t.run(async (ctx) => {
      return await ctx.db
        .query("notifications")
        .withIndex("by_recipient", (q) => q.eq("recipientId", authorId))
        .collect()
    })
    // One for the comment
    expect(notifications.some((n) => n.type === "comment")).toBe(true)
  })

  it("should bookmark a post", async () => {
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
        content: "Post to bookmark",
        visibility: "public",
        medias: [],
      })
    })

    const user = t.withIdentity({ tokenIdentifier: "user_id" })
    await user.mutation(api.bookmarks.addBookmark, { postId })

    const bookmarks = await t.run(async (ctx) => {
      return await ctx.db
        .query("bookmarks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    })
    expect(bookmarks).toHaveLength(1)
  })
})
