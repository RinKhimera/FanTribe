import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"
import {
  createNotification,
  removeActorFromNotification,
} from "./lib/notifications"
import { rateLimiter } from "./lib/rateLimiter"
import { incrementUserStat } from "./userStats"

export const likePost = mutation({
  args: { postId: v.id("posts") },
  returns: v.object({
    already: v.optional(v.boolean()),
    liked: v.optional(v.boolean()),
    likeId: v.id("likes"),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    await rateLimiter.limit(ctx, "likePost", { key: user._id, throws: true })

    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError("Post not found")

    // Vérifier doublon - utilise index composé pour O(1) lookup
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first()
    if (existing) return { already: true, likeId: existing._id }

    const likeId = await ctx.db.insert("likes", {
      userId: user._id,
      postId: args.postId,
    })

    // Mise à jour incrémentale des stats du créateur
    await incrementUserStat(ctx, post.author, { totalLikes: 1 })

    // Notification (groupée par post, prefs vérifiées, anti-spam)
    await createNotification(ctx, {
      type: "like",
      recipientId: post.author,
      actorId: user._id,
      postId: args.postId,
    })

    return { liked: true, likeId }
  },
})

export const unlikePost = mutation({
  args: { postId: v.id("posts") },
  returns: v.object({
    removed: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError("Post not found")

    // Utilise index composé pour O(1) lookup
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first()

    if (!existing) return { removed: false, reason: "Not liked" }

    await ctx.db.delete(existing._id)

    // Mise à jour incrémentale des stats du créateur
    await incrementUserStat(ctx, post.author, { totalLikes: -1 })

    // Supprimer acteur de la notification groupée
    await removeActorFromNotification(ctx, {
      type: "like",
      recipientId: post.author,
      actorId: user._id,
      postId: args.postId,
    })

    return { removed: true }
  },
})

export const countLikes = query({
  args: { postId: v.id("posts") },
  returns: v.object({ postId: v.id("posts"), count: v.number() }),
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
    return { postId: args.postId, count: list.length }
  },
})

export const isLiked = query({
  args: { postId: v.id("posts") },
  returns: v.object({ liked: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    // Utilise index composé pour O(1) lookup au lieu de O(n)
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first()
    return { liked: !!existing }
  },
})

export const getPostLikes = query({
  args: { postId: v.id("posts") },
  returns: v.array(v.object({ _id: v.id("likes"), user: v.any() })),
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
    const userIds = [...new Set(likes.map((l) => l.userId))]
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const usersMap = new Map(userIds.map((id, i) => [id, users[i]]))
    return likes.map((l) => ({ _id: l._id, user: usersMap.get(l.userId) }))
  },
})

export const getUserLikedPosts = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const limit = args.limit ?? 50
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    const postIds = likes.map((l) => l.postId).slice(0, limit)
    const posts = await Promise.all(postIds.map((id) => ctx.db.get(id)))
    const filtered = posts.filter((p) => !!p).map((p) => p!)

    // Enrichir auteurs en batch
    const authorIds = [...new Set(filtered.map((p) => p.author))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    return filtered.map((p) => ({ ...p, author: authorsMap.get(p.author) }))
  },
})

// Paginated liked posts for user profile "J'aime" tab
export const getUserLikedPostsPaginated = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(
      v.union(
        v.literal("SplitRecommended"),
        v.literal("SplitRequired"),
        v.null(),
      ),
    ),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts)

    if (result.page.length === 0) {
      return { ...result, page: [] }
    }

    // Batch fetch posts
    const postIds = result.page.map((l) => l.postId)
    const posts = await Promise.all(postIds.map((id) => ctx.db.get(id)))

    // Build post map (some may be deleted)
    const postMap = new Map(
      postIds.map((id, i) => [id, posts[i]]),
    )

    // Batch fetch authors from non-null posts
    const validPosts = posts.filter((p): p is NonNullable<typeof p> => !!p)
    const authorIds = [...new Set(validPosts.map((p) => p.author))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    const enriched = result.page
      .map((like) => {
        const post = postMap.get(like.postId)
        if (!post) return null
        const author = authorsMap.get(post.author)
        if (!author) return null
        return { ...post, author }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    return { ...result, page: enriched }
  },
})

// Count likes given by the current user (for sidebar popover)
export const getMyLikesGivenCount = query({
  args: {},
  returns: v.object({ count: v.number() }),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx)
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    return { count: likes.length }
  },
})
