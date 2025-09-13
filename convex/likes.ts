import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Helper récupération utilisateur courant
const getCurrentUser = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError("Not authenticated")
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique()
  if (!user) throw new ConvexError("User not found")
  return user
}

export const likePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError("Post not found")

    // Vérifier doublon
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first()
    if (existing) return { already: true, likeId: existing._id }

    const likeId = await ctx.db.insert("likes", {
      userId: user._id,
      postId: args.postId,
    })

    // Notification (si pas soi-même)
    if (post.author !== user._id) {
      const existingNotif = await ctx.db
        .query("notifications")
        .withIndex("by_type_post_sender", (q) =>
          q.eq("type", "like").eq("post", args.postId).eq("sender", user._id),
        )
        .unique()
      if (!existingNotif) {
        await ctx.db.insert("notifications", {
          type: "like",
          recipientId: post.author,
          sender: user._id,
          post: args.postId,
          read: false,
        })
      }
    }

    return { liked: true, likeId }
  },
})

export const unlikePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first()

    if (!existing) return { removed: false, reason: "Not liked" }

    await ctx.db.delete(existing._id)

    // Supprimer notification associée si existe
    const notif = await ctx.db
      .query("notifications")
      .withIndex("by_type_post_sender", (q) =>
        q.eq("type", "like").eq("post", args.postId).eq("sender", user._id),
      )
      .unique()
    if (notif) await ctx.db.delete(notif._id)

    return { removed: true }
  },
})

export const countLikes = query({
  args: { postId: v.id("posts") },
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
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first()
    return { liked: !!existing }
  },
})

export const getPostLikes = query({
  args: { postId: v.id("posts") },
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
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
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
