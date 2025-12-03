import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getMessages = query({
  args: {
    conversation: v.id("conversations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Limite réelle pour la requête (on prend un de plus)
    const limit = args.limit ?? 30
    const realLimit = limit + 1

    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation", args.conversation),
      )
      .order("desc") // Du plus récent au plus ancien

    // Approche sans conditionnelle pour éviter l'erreur TypeScript
    const cursor = args.cursor

    // N'appliquer le filtre que si cursor a une valeur
    if (cursor !== undefined) {
      messagesQuery = messagesQuery.filter((q) =>
        q.lt(q.field("_creationTime"), cursor),
      )
    }

    // Prendre un message de plus pour savoir s'il y en a encore
    const messages = await messagesQuery.take(realLimit)

    // S'il y a plus que la limite, il y a encore des messages à charger
    const hasMoreMessages = messages.length > limit

    // On ne retourne que les "limit" messages
    const messagesToReturn = hasMoreMessages
      ? messages.slice(0, limit)
      : messages

    // Retourner les messages dans l'ordre chronologique (du plus ancien au plus récent)
    messagesToReturn.reverse()

    // Cache des profils utilisateurs pour optimiser les requêtes
    const userProfileCache = new Map()

    const messagesWithSender = await Promise.all(
      messagesToReturn.map(async (message) => {
        let sender
        // Check if sender profile is in cache
        if (userProfileCache.has(message.sender)) {
          sender = userProfileCache.get(message.sender)
        } else {
          // Fetch sender profile from the database
          sender = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), message.sender))
            .first()
          // Cache the sender profile
          userProfileCache.set(message.sender, sender)
        }

        return { ...message, sender }
      }),
    )

    // Calculer s'il reste des messages plus anciens à charger
    const oldestMessageTimestamp =
      messagesToReturn.length > 0
        ? messagesToReturn[0]._creationTime
        : undefined

    return {
      messages: messagesWithSender,
      hasMore: hasMoreMessages,
      cursor: oldestMessageTimestamp,
    }
  },
})

export const sendTextMessage = mutation({
  args: {
    sender: v.id("users"),
    content: v.string(),
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      throw new ConvexError("User not found")
    }

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversation))
      .first()

    if (!conversation) {
      throw new ConvexError("Conversation not found")
    }

    if (!conversation.participants.includes(user._id)) {
      throw new ConvexError("You are not part of this conversation")
    }

    await ctx.db.insert("messages", {
      sender: args.sender,
      content: args.content,
      conversation: args.conversation,
      messageType: "text",
      read: false, // Par défaut, le message n'est pas lu
    })
  },
})

export const sendImage = mutation({
  args: {
    imgUrl: v.string(),
    sender: v.id("users"),
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    await ctx.db.insert("messages", {
      content: args.imgUrl,
      sender: args.sender,
      messageType: "image",
      conversation: args.conversation,
      read: false,
    })
  },
})

export const sendVideo = mutation({
  args: {
    videoId: v.id("_storage"),
    sender: v.id("users"),
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const content = (await ctx.storage.getUrl(args.videoId)) as string

    await ctx.db.insert("messages", {
      content: content,
      sender: args.sender,
      messageType: "video",
      conversation: args.conversation,
      read: false,
    })
  },
})

export const getUnreadMessagesCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      throw new ConvexError("User not found")
    }

    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await ctx.db.query("conversations").collect()

    // Filtrer les conversations auxquelles l'utilisateur participe
    const myConversations = conversations.filter((conversation) => {
      return conversation.participants.includes(user._id)
    })

    // Compter tous les messages non lus dans toutes les conversations de l'utilisateur
    let totalUnreadCount = 0

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

      totalUnreadCount += unreadMessages.length
    }

    return totalUnreadCount
  },
})

export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      throw new ConvexError("User not found")
    }

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first()

    if (!conversation) {
      throw new ConvexError("Conversation not found")
    }

    if (!conversation.participants.includes(user._id)) {
      throw new ConvexError("You are not part of this conversation")
    }

    // Récupérer tous les messages non lus dans cette conversation qui ne sont pas envoyés par l'utilisateur actuel
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation", args.conversationId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("read"), false),
          q.neq(q.field("sender"), user._id), // Ne marquer comme lus que les messages reçus
        ),
      )
      .collect()

    // Marquer tous les messages comme lus
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { read: true })
    }

    return unreadMessages.length
  },
})
