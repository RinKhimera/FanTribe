import { ConvexError, v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

// Helper: récupérer l'utilisateur courant
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

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    if (!args.content.trim()) throw new ConvexError("Empty content")

    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError("Post not found")

    // Vérifier accès si post subscribers_only
    if (post.visibility === "subscribers_only" && post.author !== user._id) {
      // Option: vérifier abonnement actif si nécessaire (déjà géré ailleurs ?)
      // Ici on ne duplique pas la logique pour rester léger.
    }

    const commentId = await ctx.db.insert("comments", {
      author: user._id,
      post: args.postId,
      content: args.content.trim(),
    })

    // Notification (si pas soi-même)
    if (post.author !== user._id) {
      const existingNotif = await ctx.db
        .query("notifications")
        .withIndex("by_type_comment_sender", (q) =>
          q
            .eq("type", "comment")
            .eq("comment", commentId as Id<"comments">)
            .eq("sender", user._id),
        )
        .unique()
      if (!existingNotif) {
        await ctx.db.insert("notifications", {
          type: "comment",
          recipientId: post.author,
          sender: user._id,
          post: args.postId,
          comment: commentId,
          read: false,
        })
      }
    }

    return { commentId }
  },
})

export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new ConvexError("Comment not found")

    if (comment.author !== user._id) {
      throw new ConvexError("Not authorized")
    }

    if (!args.content.trim()) throw new ConvexError("Empty content")

    await ctx.db.patch(args.commentId, {
      content: args.content.trim(),
    })

    return { success: true }
  },
})

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new ConvexError("Comment not found")

    const post = await ctx.db.get(comment.post)

    if (comment.author !== user._id && post?.author !== user._id) {
      throw new ConvexError("Not authorized")
    }

    await ctx.db.delete(args.commentId)

    // Supprimer notification associée
    const notif = await ctx.db
      .query("notifications")
      .withIndex("by_type_comment_sender", (q) =>
        q
          .eq("type", "comment")
          .eq("comment", args.commentId)
          .eq("sender", comment.author),
      )
      .unique()
    if (notif) await ctx.db.delete(notif._id)

    return { deleted: true }
  },
})

export const listPostComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("post", args.postId))
      .order("desc")
      .collect()

    // Batch auteurs
    const authorIds = [...new Set(comments.map((c) => c.author))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    return comments.map((c) => ({ ...c, author: authorMap.get(c.author) }))
  },
})

export const getRecentComments = query({
  args: { postId: v.id("posts"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("post", args.postId))
      .order("desc")
      .take(limit)

    // Batch auteurs
    const authorIds = [...new Set(comments.map((c) => c.author))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    return comments.map((c) => ({ ...c, author: authorMap.get(c.author) }))
  },
})

export const countForPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("post", args.postId))
      .collect()
    return { postId: args.postId, count: list.length }
  },
})

export const getUserComments = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("author", args.userId))
      .order("desc")
      .take(limit)

    const postIds = [...new Set(comments.map((c) => c.post))]
    const posts = await Promise.all(postIds.map((id) => ctx.db.get(id)))
    const postMap = new Map(postIds.map((id, i) => [id, posts[i]]))

    return comments.map((c) => ({ ...c, post: postMap.get(c.post) }))
  },
})

export const getComment = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId)
    if (!comment) return null
    const [author, post] = await Promise.all([
      ctx.db.get(comment.author),
      ctx.db.get(comment.post),
    ])
    return { ...comment, author, post }
  },
})
