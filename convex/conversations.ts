import { ConvexError, v } from "convex/values"

import { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

export const createConversation = mutation({
  args: {
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.id("_storage")),
    admin: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const existingConversation = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.eq(q.field("participants"), args.participants),
          q.eq(q.field("participants"), args.participants.reverse()),
        ),
      )
      .first()

    if (existingConversation) {
      return existingConversation._id
    }

    let groupImage

    if (args.groupImage) {
      groupImage = (await ctx.storage.getUrl(args.groupImage)) as string
    }

    const conversationId = await ctx.db.insert("conversations", {
      participants: args.participants,
      isGroup: args.isGroup,
      groupName: args.groupName,
      groupImage,
      admin: args.admin,
    })

    return conversationId
  },
})

export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    const conversations = await ctx.db.query("conversations").collect()
    const myConversations = conversations.filter((conversation) =>
      conversation.participants.includes(user._id),
    )

    if (myConversations.length === 0) return []

    // Batch fetch: collecter tous les IDs utilisateurs nécessaires (autres participants)
    const otherUserIds = new Set<string>()
    for (const conv of myConversations) {
      if (!conv.isGroup) {
        const otherUserId = conv.participants.find((id) => id !== user._id)
        if (otherUserId) otherUserIds.add(otherUserId as string)
      }
    }

    // Batch fetch des profils utilisateurs
    const userProfiles = await Promise.all(
      [...otherUserIds].map((id) => ctx.db.get(id as Id<"users">)),
    )
    const userProfileMap = new Map(
      userProfiles
        .filter((u) => u !== null)
        .map((u) => [u!._id as string, u]),
    )

    // Batch fetch du dernier message par conversation
    const lastMessagesPromises = myConversations.map((conv) =>
      ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversation", conv._id))
        .order("desc")
        .first(),
    )
    const lastMessages = await Promise.all(lastMessagesPromises)
    const lastMessageMap = new Map(
      myConversations.map((conv, i) => [conv._id as string, lastMessages[i]]),
    )

    // Utilise les compteurs dénormalisés (élimine N+1 sur messages)
    const userIdKey = user._id as string

    const conversationsWithDetails = myConversations.map((conversation) => {
      let userDetails = {}

      if (!conversation.isGroup) {
        const otherUserId = conversation.participants.find(
          (id) => id !== user._id,
        )
        if (otherUserId) {
          userDetails = userProfileMap.get(otherUserId as string) ?? {}
        }
      }

      const lastMessage =
        lastMessageMap.get(conversation._id as string) ?? undefined
      const unreadCount = conversation.unreadCounts?.[userIdKey] ?? 0

      return {
        ...userDetails,
        ...conversation,
        lastMessage,
        lastActivityTime: lastMessage
          ? lastMessage._creationTime
          : conversation._creationTime,
        hasUnreadMessages: unreadCount > 0,
        unreadCount,
      }
    })

    // Trier par date du dernier message (du plus récent au plus ancien)
    return conversationsWithDetails.sort(
      (a, b) => b.lastActivityTime - a.lastActivityTime,
    )
  },
})

// export const kickUser = mutation({
//   args: {
//     conversationId: v.id("conversations"),
//     userId: v.id("users"),
//   },
//   handler: async (ctx, args) => {
//     const identity = await ctx.auth.getUserIdentity()
//     if (!identity) throw new ConvexError("Unauthorized")

//     const conversation = await ctx.db
//       .query("conversations")
//       .filter((q) => q.eq(q.field("_id"), args.conversationId))
//       .unique()

//     if (!conversation) throw new ConvexError("Conversation not found")

//     await ctx.db.patch(args.conversationId, {
//       participants: conversation.participants.filter(
//         (id) => id !== args.userId
//       ),
//     })
//   },
// })

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl()
})

export const getCurrentConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const existingConversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique()

    return existingConversation
  },
})

export const getGroupMembers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) throw new ConvexError("Unauthorized")

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first()

    if (!conversation) throw new ConvexError("Conversation not found")

    const users = await ctx.db.query("users").collect()

    const groupMembers = users.filter((user) =>
      conversation.participants.includes(user._id),
    )

    return groupMembers
  },
})
