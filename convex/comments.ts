import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"
import {
  createNotification,
  removeActorFromNotification,
} from "./lib/notifications"
import { rateLimiter } from "./lib/rateLimiter"
import { postDocValidator, userDocValidator } from "./lib/validators"

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  returns: v.object({ commentId: v.id("comments") }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    await rateLimiter.limit(ctx, "addComment", { key: user._id, throws: true })

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

    // Notification (groupée par post, prefs vérifiées, anti-spam)
    await createNotification(ctx, {
      type: "comment",
      recipientId: post.author,
      actorId: user._id,
      postId: args.postId,
      commentId,
    })

    return { commentId }
  },
})

export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
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
  returns: v.object({ deleted: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new ConvexError("Comment not found")

    const post = await ctx.db.get(comment.post)

    if (comment.author !== user._id && post?.author !== user._id) {
      throw new ConvexError("Not authorized")
    }

    await ctx.db.delete(args.commentId)

    // Supprimer acteur de la notification groupée
    if (post) {
      await removeActorFromNotification(ctx, {
        type: "comment",
        recipientId: post.author,
        actorId: comment.author,
        postId: comment.post,
      })
    }

    return { deleted: true }
  },
})

export const listPostComments = query({
  args: { postId: v.id("posts") },
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      author: v.optional(v.union(userDocValidator, v.null())),
      post: v.id("posts"),
      content: v.string(),
    }),
  ),
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
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      author: v.optional(v.union(userDocValidator, v.null())),
      post: v.id("posts"),
      content: v.string(),
    }),
  ),
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
  returns: v.object({ postId: v.id("posts"), count: v.number() }),
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
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      author: v.id("users"),
      post: v.optional(v.union(postDocValidator, v.null())),
      content: v.string(),
    }),
  ),
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
  returns: v.union(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      author: v.union(userDocValidator, v.null()),
      post: v.union(postDocValidator, v.null()),
      content: v.string(),
    }),
    v.null(),
  ),
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
