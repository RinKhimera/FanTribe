import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"

export const addBookmark = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    // Vérifier existence du post
    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError("Post not found")

    // Vérifier doublon
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first()

    if (existing) {
      return { already: true, bookmarkId: existing._id }
    }

    const bookmarkId = await ctx.db.insert("bookmarks", {
      userId: user._id,
      postId: args.postId,
    })

    return { added: true, bookmarkId }
  },
})

export const removeBookmark = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first()

    if (!existing) {
      return { removed: false, reason: "Not bookmarked" }
    }

    await ctx.db.delete(existing._id)
    return { removed: true }
  },
})

export const getUserBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx)

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    const posts = await Promise.all(bookmarks.map((b) => ctx.db.get(b.postId)))
    const result = posts.filter((p) => !!p).map((p) => p!)

    // Enrichir avec auteurs
    const authorIds = [...new Set(result.map((p) => p.author))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    const enrichedPosts = result.map((p) => ({
      ...p,
      author: authorsMap.get(p.author),
    }))

    return {
      count: enrichedPosts.length,
      posts: enrichedPosts,
    }
  },
})

export const isBookmarked = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first()

    return { bookmarked: !!existing }
  },
})

export const countBookmarks = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("bookmarks")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
    return { postId: args.postId, count: list.length }
  },
})
