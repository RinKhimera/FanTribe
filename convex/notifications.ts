import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getUserNotifications = query({
  args: {},
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

    const userNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .order("desc")
      .collect()

    const userNotificationsWithDetails = await Promise.all(
      userNotifications.map(async (notification) => {
        const sender = await ctx.db
          .query("users")
          .withIndex("by_id", (q) => q.eq("_id", notification.sender))
          .unique()

        let post
        if (notification.post) {
          post = await ctx.db
            .query("posts")
            .withIndex("by_id", (q) => q.eq("_id", notification.post!))
            .unique()
        }

        let comment
        if (notification.comment) {
          comment = await ctx.db
            .query("comments")
            .withIndex("by_id", (q) => q.eq("_id", notification.comment!))
            .unique()
        }

        const recipientId = await ctx.db
          .query("users")
          .withIndex("by_id", (q) => q.eq("_id", notification.recipientId))
          .unique()

        return { ...notification, sender, post, comment, recipientId }
      }),
    )

    return userNotificationsWithDetails
  },
})

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    // Trouver la notif à marquer comme lue
    const notification = await ctx.db
      .query("notifications")
      .withIndex("by_id", (q) => q.eq("_id", args.notificationId))
      .unique()

    if (!notification) throw new ConvexError("Notification not found")

    await ctx.db.patch(notification._id, { read: true })
  },
})

export const markNotificationAsUnread = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    // Trouver la notif à marquer comme non lue
    const notification = await ctx.db
      .query("notifications")
      .withIndex("by_id", (q) => q.eq("_id", args.notificationId))
      .unique()

    if (!notification) throw new ConvexError("Notification not found")

    await ctx.db.patch(notification._id, { read: false })
  },
})

export const getUnreadCounts = query({
  args: {},
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

    // Compter les notifications non lues
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .filter((q) => q.eq(q.field("read"), false))
      .collect()

    const unreadNotificationsCount = unreadNotifications.length

    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await ctx.db.query("conversations").collect()

    // Filtrer les conversations auxquelles l'utilisateur participe
    const myConversations = conversations.filter((conversation) => {
      return conversation.participants.includes(user._id)
    })

    // Compter tous les messages non lus dans toutes les conversations de l'utilisateur
    let unreadMessagesCount = 0

    for (const conversation of myConversations) {
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversation", conversation._id),
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("read"), false),
            q.neq(q.field("sender"), user._id), // Ne pas compter nos propres messages
          ),
        )
        .collect()

      unreadMessagesCount += unreadMessages.length
    }

    return {
      unreadNotificationsCount,
      unreadMessagesCount,
    }
  },
})
