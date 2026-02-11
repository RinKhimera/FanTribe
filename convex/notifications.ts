import { ConvexError, v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"

export const getUserNotifications = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .order("desc")
      .take(200)

    if (notifications.length === 0) return []

    // Batch fetch: collect all unique IDs first
    const senderIds = [...new Set(notifications.map((n) => n.sender))]
    const postIds = [
      ...new Set(notifications.filter((n) => n.post).map((n) => n.post!)),
    ]
    const commentIds = [
      ...new Set(notifications.filter((n) => n.comment).map((n) => n.comment!)),
    ]
    const tipIds = [
      ...new Set(notifications.filter((n) => n.tip).map((n) => n.tip!)),
    ]

    // Fetch all related data in parallel batches
    const [senders, posts, comments, tips] = await Promise.all([
      Promise.all(senderIds.map((id) => ctx.db.get(id))),
      Promise.all(postIds.map((id) => ctx.db.get(id))),
      Promise.all(commentIds.map((id) => ctx.db.get(id))),
      Promise.all(tipIds.map((id) => ctx.db.get(id))),
    ])

    // Create lookup maps for O(1) access
    const senderMap = new Map(senders.filter(Boolean).map((s) => [s!._id, s]))
    const postMap = new Map(posts.filter(Boolean).map((p) => [p!._id, p]))
    const commentMap = new Map(comments.filter(Boolean).map((c) => [c!._id, c]))
    const tipMap = new Map(tips.filter(Boolean).map((t) => [t!._id, t]))

    // Enrich notifications using maps (no N+1!)
    return notifications.map((notification) => ({
      ...notification,
      sender: senderMap.get(notification.sender) ?? null,
      post: notification.post ? (postMap.get(notification.post) ?? null) : null,
      comment: notification.comment
        ? (commentMap.get(notification.comment) ?? null)
        : null,
      tip: notification.tip ? (tipMap.get(notification.tip) ?? null) : null,
      recipientId: user,
    }))
  },
})

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) throw new ConvexError("Notification not found")

    if (notification.recipientId !== user._id) {
      throw new ConvexError("Unauthorized")
    }

    await ctx.db.patch(args.notificationId, { read: true })
    return null
  },
})

export const markNotificationAsUnread = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) throw new ConvexError("Notification not found")

    if (notification.recipientId !== user._id) {
      throw new ConvexError("Unauthorized")
    }

    await ctx.db.patch(args.notificationId, { read: false })
    return null
  },
})

export const getUnreadCounts = query({
  args: {},
  returns: v.object({
    unreadNotificationsCount: v.number(),
    unreadMessagesCount: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    // Notifications: utilise index composé by_recipient_read
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) =>
        q.eq("recipientId", user._id).eq("read", false),
      )
      .take(500)

    const unreadNotificationsCount = unreadNotifications.length

    // Messages: utilise compteurs dénormalisés (élimine N+1 queries)
    // Récupérer les conversations où l'utilisateur est créateur ou user
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

    // Calculer le total des non-lus
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
      unreadNotificationsCount,
      unreadMessagesCount,
    }
  },
})

export const insertNewPostNotification = internalMutation({
  args: {
    recipientId: v.id("users"),
    sender: v.id("users"),
    postId: v.id("posts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.recipientId === args.sender) return null
    await ctx.db.insert("notifications", {
      type: "newPost",
      recipientId: args.recipientId,
      sender: args.sender,
      post: args.postId,
      read: false,
    })
    return null
  },
})

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {},
  returns: v.object({ count: v.number() }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) =>
        q.eq("recipientId", user._id).eq("read", false),
      )
      .take(500)

    await Promise.all(
      unreadNotifications.map((n) => ctx.db.patch(n._id, { read: true })),
    )

    return { count: unreadNotifications.length }
  },
})

// Delete a notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) throw new ConvexError("Notification not found")

    // Verify ownership
    if (notification.recipientId !== user._id) {
      throw new ConvexError("Unauthorized")
    }

    await ctx.db.delete(args.notificationId)
    return null
  },
})

// Get notifications filtered by type
export const getNotificationsByType = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("like"),
        v.literal("comment"),
        v.literal("subscriptions"),
        v.literal("newPost"),
        v.literal("tip"),
        v.literal("all"),
      ),
    ),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    // Types de notifications liees aux abonnements
    const subscriptionTypes = [
      "newSubscription",
      "renewSubscription",
      "subscription_expired",
    ]

    let notifications
    if (args.type && args.type !== "all") {
      if (args.type === "subscriptions") {
        // Pour le filtre groupe "subscriptions", on recupere toutes les notifs et on filtre en memoire
        const allNotifications = await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
          .order("desc")
          .take(200)
        notifications = allNotifications.filter((n) =>
          subscriptionTypes.includes(n.type),
        )
      } else {
        // Type is now narrowed to "like" | "comment" | "newPost" (actual notification types)
        const filterType = args.type as
          | "newPost"
          | "like"
          | "comment"
          | "newSubscription"
          | "renewSubscription"
          | "subscription_expired"
        notifications = await ctx.db
          .query("notifications")
          .withIndex("by_recipient_type", (q) =>
            q.eq("recipientId", user._id).eq("type", filterType),
          )
          .order("desc")
          .take(200)
      }
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
        .order("desc")
        .take(200)
    }

    if (notifications.length === 0) return []

    // Batch fetch: collect all unique IDs first
    const senderIds = [...new Set(notifications.map((n) => n.sender))]
    const postIds = [
      ...new Set(notifications.filter((n) => n.post).map((n) => n.post!)),
    ]
    const commentIds = [
      ...new Set(notifications.filter((n) => n.comment).map((n) => n.comment!)),
    ]
    const tipIds = [
      ...new Set(notifications.filter((n) => n.tip).map((n) => n.tip!)),
    ]

    // Fetch all related data in parallel batches
    const [senders, posts, comments, tips] = await Promise.all([
      Promise.all(senderIds.map((id) => ctx.db.get(id))),
      Promise.all(postIds.map((id) => ctx.db.get(id))),
      Promise.all(commentIds.map((id) => ctx.db.get(id))),
      Promise.all(tipIds.map((id) => ctx.db.get(id))),
    ])

    // Create lookup maps for O(1) access
    const senderMap = new Map(senders.filter(Boolean).map((s) => [s!._id, s]))
    const postMap = new Map(posts.filter(Boolean).map((p) => [p!._id, p]))
    const commentMap = new Map(comments.filter(Boolean).map((c) => [c!._id, c]))
    const tipMap = new Map(tips.filter(Boolean).map((t) => [t!._id, t]))

    // Enrich notifications using maps (no N+1!)
    return notifications.map((notification) => ({
      ...notification,
      sender: senderMap.get(notification.sender) ?? null,
      recipientId: user,
      post: notification.post ? (postMap.get(notification.post) ?? null) : null,
      comment: notification.comment
        ? (commentMap.get(notification.comment) ?? null)
        : null,
      tip: notification.tip ? (tipMap.get(notification.tip) ?? null) : null,
    }))
  },
})
