/**
 * Notification queries and mutations.
 *
 * All notification creation goes through the central service in lib/notifications.ts.
 * This file handles reading, filtering, marking, and deleting notifications.
 */
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { Doc, Id } from "./_generated/dataModel"
import { internalMutation, mutation, query, QueryCtx } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"
import { createAppError } from "./lib/errors"
import { createNotification } from "./lib/notifications"
import {
  enrichedNotificationValidator,
  notificationTypeValidator,
} from "./lib/validators"

// ============================================================================
// Constants
// ============================================================================

const notificationFilterValidator = v.union(
  v.literal("all"),
  v.literal("like"),
  v.literal("comment"),
  v.literal("newPost"),
  v.literal("subscriptions"),
  v.literal("tip"),
)

// Pagination result shape (matches Convex PaginationResult)
const paginatedNotificationsValidator = v.object({
  page: v.array(enrichedNotificationValidator),
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
})

// ============================================================================
// Shared enrichment helper
// ============================================================================

async function enrichNotifications(
  ctx: QueryCtx,
  notifications: Doc<"notifications">[],
) {
  if (notifications.length === 0) return []

  // Collect all unique IDs
  const actorIdSet = new Set<Id<"users">>()
  const postIdSet = new Set<Id<"posts">>()
  const commentIdSet = new Set<Id<"comments">>()
  const tipIdSet = new Set<Id<"tips">>()

  for (const n of notifications) {
    for (const actorId of n.actorIds) actorIdSet.add(actorId)
    if (n.postId) postIdSet.add(n.postId)
    if (n.commentId) commentIdSet.add(n.commentId)
    if (n.tipId) tipIdSet.add(n.tipId)
  }

  // Batch fetch in parallel
  const [actors, posts, comments, tips] = await Promise.all([
    Promise.all([...actorIdSet].map((id) => ctx.db.get(id))),
    Promise.all([...postIdSet].map((id) => ctx.db.get(id))),
    Promise.all([...commentIdSet].map((id) => ctx.db.get(id))),
    Promise.all([...tipIdSet].map((id) => ctx.db.get(id))),
  ])

  // Create lookup maps
  const actorMap = new Map(
    actors.filter(Boolean).map((a) => [a!._id, a!]),
  )
  const postMap = new Map(
    posts.filter(Boolean).map((p) => [p!._id, p!]),
  )
  const commentMap = new Map(
    comments.filter(Boolean).map((c) => [c!._id, c!]),
  )
  const tipMap = new Map(
    tips.filter(Boolean).map((t) => [t!._id, t!]),
  )

  return notifications.map((n) => {
    const enrichedActors = n.actorIds
      .map((id) => actorMap.get(id))
      .filter(Boolean)
      .map((a) => ({
        _id: a!._id,
        name: a!.name,
        username: a!.username,
        image: a!.image,
      }))

    const post = n.postId ? postMap.get(n.postId) : undefined
    const comment = n.commentId ? commentMap.get(n.commentId) : undefined
    const tip = n.tipId ? tipMap.get(n.tipId) : undefined

    return {
      _id: n._id,
      _creationTime: n._creationTime,
      type: n.type,
      recipientId: n.recipientId,
      groupKey: n.groupKey,
      actors: enrichedActors,
      actorCount: n.actorCount,
      postId: n.postId,
      postPreview: post?.content?.slice(0, 100),
      commentId: n.commentId,
      commentPreview: comment?.content?.slice(0, 100),
      tipId: n.tipId,
      tipAmount: n.tipAmount,
      tipCurrency: n.tipCurrency,
      tipMessage: tip?.message,
      isRead: n.isRead,
      lastActivityAt: n.lastActivityAt,
    }
  })
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Paginated notifications with optional type filter.
 * Replaces both getUserNotifications and getNotificationsByType.
 */
export const getNotifications = query({
  args: {
    filter: v.optional(notificationFilterValidator),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginatedNotificationsValidator,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const filter = args.filter ?? "all"

    let paginationResult

    if (filter === "subscriptions") {
      // Subscriptions groups 4 types — use by_recipient + filter
      paginationResult = await ctx.db
        .query("notifications")
        .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
        .order("desc")
        .filter((q) =>
          q.or(
            q.eq(q.field("type"), "newSubscription"),
            q.eq(q.field("type"), "renewSubscription"),
            q.eq(q.field("type"), "subscriptionExpired"),
            q.eq(q.field("type"), "subscriptionConfirmed"),
          ),
        )
        .paginate(args.paginationOpts)
    } else if (filter === "all") {
      paginationResult = await ctx.db
        .query("notifications")
        .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
        .order("desc")
        .paginate(args.paginationOpts)
    } else {
      // Single type — use by_recipient_type index
      paginationResult = await ctx.db
        .query("notifications")
        .withIndex("by_recipient_type", (q) =>
          q.eq("recipientId", user._id).eq("type", filter),
        )
        .order("desc")
        .paginate(args.paginationOpts)
    }

    const enrichedPage = await enrichNotifications(ctx, paginationResult.page)

    return {
      ...paginationResult,
      page: enrichedPage,
    }
  },
})

/**
 * Unread notification count + unread messages count.
 * Used by sidebar and mobile nav badges.
 */
export const getUnreadCounts = query({
  args: {},
  returns: v.object({
    unreadNotificationsCount: v.number(),
    unreadMessagesCount: v.number(),
  }),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx)

    // Notifications: use by_recipient_read index
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) =>
        q.eq("recipientId", user._id).eq("isRead", false),
      )
      .take(500)

    // Messages: denormalized unread counts from conversations
    const [asCreator, asUser] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", user._id))
        .take(500),
      ctx.db
        .query("conversations")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .take(500),
    ])

    let unreadMessagesCount = 0
    for (const conv of asCreator) {
      if (!conv.deletedByCreator && !conv.mutedByCreator) {
        unreadMessagesCount += conv.unreadCountCreator
      }
    }
    for (const conv of asUser) {
      if (!conv.deletedByUser && !conv.mutedByUser) {
        unreadMessagesCount += conv.unreadCountUser
      }
    }

    return {
      unreadNotificationsCount: unreadNotifications.length,
      unreadMessagesCount,
    }
  },
})

// ============================================================================
// Mutations
// ============================================================================

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) throw createAppError("NOTIFICATION_NOT_FOUND")
    if (notification.recipientId !== user._id) {
      throw createAppError("UNAUTHORIZED")
    }

    await ctx.db.patch(args.notificationId, { isRead: true })
    return null
  },
})

export const markAsUnread = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) throw createAppError("NOTIFICATION_NOT_FOUND")
    if (notification.recipientId !== user._id) {
      throw createAppError("UNAUTHORIZED")
    }

    await ctx.db.patch(args.notificationId, { isRead: false })
    return null
  },
})

export const markAllAsRead = mutation({
  args: {},
  returns: v.object({ count: v.number() }),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx)

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) =>
        q.eq("recipientId", user._id).eq("isRead", false),
      )
      .take(500)

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { isRead: true })),
    )

    return { count: unread.length }
  },
})

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) throw createAppError("NOTIFICATION_NOT_FOUND")
    if (notification.recipientId !== user._id) {
      throw createAppError("UNAUTHORIZED")
    }

    await ctx.db.delete(args.notificationId)
    return null
  },
})

// ============================================================================
// Internal mutations (for actions that need runMutation)
// ============================================================================

/**
 * Thin wrapper around createNotification for use from internalActions.
 * Actions can't call helper functions directly — they need runMutation.
 */
export const createSingleNotification = internalMutation({
  args: {
    type: notificationTypeValidator,
    recipientId: v.id("users"),
    actorId: v.id("users"),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    tipId: v.optional(v.id("tips")),
    tipAmount: v.optional(v.number()),
    tipCurrency: v.optional(v.string()),
  },
  returns: v.object({
    created: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return await createNotification(ctx, args)
  },
})

// ============================================================================
// Migration: Clean slate (run once after schema deploy, then delete)
// ============================================================================

/**
 * Deletes ALL notifications and pendingNotifications in batches.
 * Run via Convex dashboard after deploying the new schema.
 * Delete this function after running it.
 */
export const clearAllNotifications = internalMutation({
  args: {},
  returns: v.object({
    deletedNotifications: v.number(),
    deletedPending: v.number(),
  }),
  handler: async (ctx) => {
    let deletedNotifications = 0
    let deletedPending = 0

    // Delete notifications in batches of 500
    let notifBatch = await ctx.db.query("notifications").take(500)
    while (notifBatch.length > 0) {
      await Promise.all(notifBatch.map((n) => ctx.db.delete(n._id)))
      deletedNotifications += notifBatch.length
      notifBatch = await ctx.db.query("notifications").take(500)
    }

    // Delete pendingNotifications in batches of 500
    let pendingBatch = await ctx.db.query("pendingNotifications").take(500)
    while (pendingBatch.length > 0) {
      await Promise.all(pendingBatch.map((n) => ctx.db.delete(n._id)))
      deletedPending += pendingBatch.length
      pendingBatch = await ctx.db.query("pendingNotifications").take(500)
    }

    return { deletedNotifications, deletedPending }
  },
})
