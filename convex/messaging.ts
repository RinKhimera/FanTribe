import { v } from "convex/values"
import { Doc } from "./_generated/dataModel"
import { internalMutation, mutation, query } from "./_generated/server"
import { MutationCtx, QueryCtx } from "./_generated/server"
import {
  checkConversationPermissions,
  checkMessagingPermission,
  getConversationRole,
  truncateMessagePreview,
} from "./lib/messaging"

// ============================================
// HELPERS INTERNES
// ============================================

/**
 * Récupère l'utilisateur authentifié ou lève une erreur
 */
const getAuthenticatedUser = async (ctx: MutationCtx | QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Non authentifié")
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique()

  if (!user) {
    throw new Error("Utilisateur non trouvé")
  }

  return user
}

// ============================================
// MUTATIONS - Gestion des conversations
// ============================================

/**
 * Démarre une nouvelle conversation avec un créateur ou récupère l'existante
 */
export const startConversation = mutation({
  args: {
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    // Vérifier que le destinataire est bien un créateur
    const creator = await ctx.db.get(args.creatorId)
    if (!creator) {
      throw new Error("Créateur non trouvé")
    }

    if (creator.accountType !== "CREATOR") {
      throw new Error("Ce utilisateur n'est pas un créateur")
    }

    // Vérifier les permissions
    const permission = await checkMessagingPermission(
      ctx,
      user._id,
      args.creatorId,
    )

    if (!permission.canSend) {
      throw new Error(
        permission.reason === "no_content_subscription"
          ? "Vous devez d'abord vous abonner au contenu de ce créateur"
          : permission.reason === "no_messaging_subscription"
            ? "Vous devez acheter un abonnement messagerie pour contacter ce créateur"
            : permission.reason === "creator_to_creator_blocked"
              ? "Les créateurs ne peuvent pas s'envoyer de messages entre eux"
              : "Vous n'êtes pas autorisé à envoyer des messages à cet utilisateur",
      )
    }

    // Vérifier si une conversation existe déjà
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("creatorId", args.creatorId).eq("userId", user._id),
      )
      .first()

    if (existingConversation) {
      // Si la conversation était supprimée par le user, la restaurer
      if (existingConversation.deletedByUser) {
        await ctx.db.patch(existingConversation._id, {
          deletedByUser: false,
        })
      }
      return existingConversation._id
    }

    // Créer une nouvelle conversation
    const conversationId = await ctx.db.insert("conversations", {
      creatorId: args.creatorId,
      userId: user._id,
      unreadCountCreator: 0,
      unreadCountUser: 0,
      isLocked: false,
      // Tracking de l'initiateur
      initiatedBy: user._id,
      initiatorRole: "user",
      requiresSubscription: true, // User doit avoir un abonnement
    })

    // Insérer un message système "conversation démarrée"
    await ctx.db.insert("messages", {
      conversationId,
      senderId: user._id,
      messageType: "system",
      systemMessageType: "conversation_started",
    })

    return conversationId
  },
})

/**
 * Démarre une conversation depuis le profil créateur (pour le créateur ou admin)
 * - Admin : pas besoin d'abonnement (requiresSubscription: false)
 * - Créateur : offre 3 jours de messaging_access gratuit à l'utilisateur
 */
export const startConversationAsCreator = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const creator = await getAuthenticatedUser(ctx)

    if (
      creator.accountType !== "CREATOR" &&
      creator.accountType !== "SUPERUSER"
    ) {
      throw new Error("Seuls les créateurs peuvent initier des conversations")
    }

    // Vérifier que le destinataire existe et est un user
    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) {
      throw new Error("Utilisateur non trouvé")
    }

    const isAdmin = creator.accountType === "SUPERUSER"
    const initiatorRole = isAdmin ? "admin" : "creator"

    // Vérifier si une conversation existe déjà
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("creatorId", creator._id).eq("userId", args.userId),
      )
      .first()

    if (existingConversation) {
      // Restaurer si supprimée par le créateur
      if (existingConversation.deletedByCreator) {
        await ctx.db.patch(existingConversation._id, {
          deletedByCreator: false,
        })
      }
      return existingConversation._id
    }

    // Créer une nouvelle conversation
    const conversationId = await ctx.db.insert("conversations", {
      creatorId: creator._id,
      userId: args.userId,
      unreadCountCreator: 0,
      unreadCountUser: 0,
      isLocked: false,
      // Tracking de l'initiateur
      initiatedBy: creator._id,
      initiatorRole,
      // Admin : pas besoin d'abonnement, Créateur : abonnement requis (mais on offre 3 jours)
      requiresSubscription: !isAdmin,
    })

    // Si c'est un créateur (pas admin), offrir 3 jours de messaging_access gratuit
    if (!isAdmin) {
      const now = Date.now()
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000

      // Vérifier si l'utilisateur a déjà un messaging_access actif avec ce créateur
      const existingMessagingSub = await ctx.db
        .query("subscriptions")
        .withIndex("by_creator_subscriber", (q) =>
          q.eq("creator", creator._id).eq("subscriber", args.userId),
        )
        .filter((q) => q.eq(q.field("type"), "messaging_access"))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first()

      // Si pas d'abonnement actif, créer un abonnement gratuit de 3 jours
      if (!existingMessagingSub) {
        await ctx.db.insert("subscriptions", {
          subscriber: args.userId,
          creator: creator._id,
          startDate: now,
          endDate: now + threeDaysMs,
          amountPaid: 0, // Gratuit
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: now,
          type: "messaging_access",
          status: "active",
          grantedByCreator: true, // Offert par le créateur
        })
      }
    }

    // Insérer un message système
    await ctx.db.insert("messages", {
      conversationId,
      senderId: creator._id,
      messageType: "system",
      systemMessageType: "conversation_started",
    })

    return conversationId
  },
})

// ============================================
// MUTATIONS - Envoi de messages
// ============================================

/**
 * Envoie un message texte dans une conversation
 */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.optional(v.string()),
    medias: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("image"),
            v.literal("video"),
            v.literal("audio"),
            v.literal("document"),
          ),
          url: v.string(),
          mediaId: v.string(),
          mimeType: v.string(),
          fileName: v.optional(v.string()),
          fileSize: v.optional(v.number()),
          thumbnailUrl: v.optional(v.string()),
          duration: v.optional(v.number()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
    ),
    replyToMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    // Vérifier les permissions
    const permissions = await checkConversationPermissions(
      ctx,
      args.conversationId,
      user._id,
    )

    if (!permissions.canSend) {
      throw new Error(
        permissions.reason === "no_messaging_subscription"
          ? "Votre abonnement messagerie a expiré. Renouvelez pour continuer."
          : permissions.reason === "admin_blocked"
            ? "Cette conversation a été bloquée par un administrateur"
            : "Vous n'êtes pas autorisé à envoyer des messages dans cette conversation",
      )
    }

    // Vérifier si l'utilisateur peut envoyer des médias
    if (args.medias && args.medias.length > 0) {
      if (!permissions.canSendMedia) {
        throw new Error("Seuls les créateurs peuvent envoyer des médias")
      }
    }

    // Valider qu'il y a du contenu
    const hasContent = args.content && args.content.trim().length > 0
    const hasMedia = args.medias && args.medias.length > 0

    if (!hasContent && !hasMedia) {
      throw new Error("Le message doit contenir du texte ou des médias")
    }

    // Déterminer le type de message
    const messageType = hasMedia ? "media" : "text"

    // Vérifier si la conversation est verrouillée (pour le créateur qui envoie)
    const conversation = await ctx.db.get(args.conversationId)
    const role = conversation
      ? await getConversationRole(ctx, args.conversationId, user._id)
      : null

    // Créer le message avec indicateur si envoyé pendant verrouillage
    // Un créateur peut envoyer même quand c'est verrouillé, mais on track cela
    const isSendingWhileLocked =
      role === "creator" && conversation?.isLocked === true

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      content: args.content?.trim(),
      medias: args.medias,
      messageType,
      replyToMessageId: args.replyToMessageId,
      // Marquer si le message est envoyé pendant que la conversation est verrouillée
      ...(isSendingWhileLocked && { sentWhileLocked: true }),
    })

    // Mettre à jour la conversation avec les infos du dernier message
    if (conversation) {
      const preview = hasMedia
        ? `[${args.medias![0].type === "image" ? "Photo" : args.medias![0].type === "video" ? "Vidéo" : args.medias![0].type === "audio" ? "Audio" : "Document"}]`
        : truncateMessagePreview(args.content)

      await ctx.db.patch(args.conversationId, {
        lastMessageAt: Date.now(),
        lastMessagePreview: preview,
        lastMessageSenderId: user._id,
        // Incrémenter le compteur de l'autre participant
        ...(role === "creator"
          ? { unreadCountUser: conversation.unreadCountUser + 1 }
          : { unreadCountCreator: conversation.unreadCountCreator + 1 }),
      })
    }

    // Supprimer l'indicateur de frappe
    const typingIndicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first()

    if (typingIndicator) {
      await ctx.db.delete(typingIndicator._id)
    }

    return messageId
  },
})

// ============================================
// MUTATIONS - Actions sur les messages
// ============================================

/**
 * Modifie un message existant
 */
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error("Message non trouvé")
    }

    // Vérifier que l'utilisateur est l'auteur
    if (message.senderId !== user._id) {
      throw new Error("Vous ne pouvez modifier que vos propres messages")
    }

    // Vérifier que le message n'est pas supprimé
    if (message.isDeleted) {
      throw new Error("Ce message a été supprimé")
    }

    // Vérifier que c'est un message texte
    if (message.messageType === "system") {
      throw new Error("Les messages système ne peuvent pas être modifiés")
    }

    // Limite de temps pour l'édition (15 minutes)
    const fifteenMinutes = 15 * 60 * 1000
    if (Date.now() - message._creationTime > fifteenMinutes) {
      throw new Error(
        "Vous ne pouvez plus modifier ce message après 15 minutes",
      )
    }

    // Sauvegarder le contenu original si première édition
    const originalContent = message.originalContent ?? message.content

    await ctx.db.patch(args.messageId, {
      content: args.newContent.trim(),
      isEdited: true,
      editedAt: Date.now(),
      originalContent,
    })

    // Mettre à jour le preview si c'était le dernier message
    const conversation = await ctx.db.get(message.conversationId)
    if (
      conversation &&
      conversation.lastMessageSenderId === user._id &&
      message.messageType === "text"
    ) {
      await ctx.db.patch(message.conversationId, {
        lastMessagePreview: truncateMessagePreview(args.newContent),
      })
    }
  },
})

/**
 * Supprime un message (soft delete)
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error("Message non trouvé")
    }

    // L'auteur ou un admin peut supprimer
    const isAuthor = message.senderId === user._id
    const isAdmin = user.accountType === "SUPERUSER"

    if (!isAuthor && !isAdmin) {
      throw new Error("Vous ne pouvez supprimer que vos propres messages")
    }

    // Vérifier que le message n'est pas déjà supprimé
    if (message.isDeleted) {
      throw new Error("Ce message est déjà supprimé")
    }

    // Soft delete
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: user._id,
    })

    // Mettre à jour le preview si c'était le dernier message
    const conversation = await ctx.db.get(message.conversationId)
    if (conversation && conversation.lastMessageSenderId === message.senderId) {
      await ctx.db.patch(message.conversationId, {
        lastMessagePreview: "[Message supprimé]",
      })
    }
  },
})

/**
 * Ajoute ou toggle une réaction emoji à un message
 */
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error("Message non trouvé")
    }

    // Vérifier que l'utilisateur est participant
    const permissions = await checkConversationPermissions(
      ctx,
      message.conversationId,
      user._id,
    )

    if (!permissions.canRead) {
      throw new Error("Vous n'avez pas accès à cette conversation")
    }

    const reactions = message.reactions ?? []
    const existingIndex = reactions.findIndex(
      (r) => r.userId === user._id && r.emoji === args.emoji,
    )

    if (existingIndex >= 0) {
      // Retirer la réaction (toggle off - même emoji cliqué)
      reactions.splice(existingIndex, 1)
    } else {
      // Supprimer toute réaction existante de cet utilisateur (un seul sticker par user)
      const userReactionIndex = reactions.findIndex(
        (r) => r.userId === user._id,
      )
      if (userReactionIndex >= 0) {
        reactions.splice(userReactionIndex, 1)
      }
      // Ajouter la nouvelle réaction
      reactions.push({
        emoji: args.emoji,
        userId: user._id,
        createdAt: Date.now(),
      })
    }

    await ctx.db.patch(args.messageId, { reactions })
  },
})

// ============================================
// MUTATIONS - Gestion de la conversation
// ============================================

/**
 * Marque une conversation comme lue
 */
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const role = await getConversationRole(ctx, args.conversationId, user._id)

    if (!role && user.accountType !== "SUPERUSER") {
      throw new Error("Vous n'êtes pas participant de cette conversation")
    }

    // Réinitialiser le compteur pour cet utilisateur
    await ctx.db.patch(args.conversationId, {
      ...(role === "creator"
        ? { unreadCountCreator: 0 }
        : { unreadCountUser: 0 }),
    })
  },
})

/**
 * Toggle mute d'une conversation
 */
export const toggleMute = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const conversation = await ctx.db.get(args.conversationId)

    if (!conversation) {
      throw new Error("Conversation non trouvée")
    }

    const role = await getConversationRole(ctx, args.conversationId, user._id)
    if (!role) {
      throw new Error("Vous n'êtes pas participant de cette conversation")
    }

    const currentMuted =
      role === "creator"
        ? conversation.mutedByCreator
        : conversation.mutedByUser

    await ctx.db.patch(args.conversationId, {
      ...(role === "creator"
        ? { mutedByCreator: !currentMuted }
        : { mutedByUser: !currentMuted }),
    })
  },
})

/**
 * Toggle pin d'une conversation
 */
export const togglePin = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const conversation = await ctx.db.get(args.conversationId)

    if (!conversation) {
      throw new Error("Conversation non trouvée")
    }

    const role = await getConversationRole(ctx, args.conversationId, user._id)
    if (!role) {
      throw new Error("Vous n'êtes pas participant de cette conversation")
    }

    const currentPinned =
      role === "creator"
        ? conversation.pinnedByCreator
        : conversation.pinnedByUser

    await ctx.db.patch(args.conversationId, {
      ...(role === "creator"
        ? { pinnedByCreator: !currentPinned }
        : { pinnedByUser: !currentPinned }),
    })
  },
})

/**
 * Supprime une conversation (soft delete pour l'utilisateur)
 */
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const role = await getConversationRole(ctx, args.conversationId, user._id)

    if (!role && user.accountType !== "SUPERUSER") {
      throw new Error("Vous n'êtes pas participant de cette conversation")
    }

    await ctx.db.patch(args.conversationId, {
      ...(role === "creator"
        ? { deletedByCreator: true }
        : { deletedByUser: true }),
    })
  },
})

// ============================================
// MUTATIONS - Indicateur de frappe
// ============================================

/**
 * Met à jour l'indicateur de frappe
 */
export const setTypingIndicator = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    // Vérifier que l'utilisateur est participant
    const role = await getConversationRole(ctx, args.conversationId, user._id)
    if (!role && user.accountType !== "SUPERUSER") {
      return // Ignorer silencieusement
    }

    // Chercher un indicateur existant
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first()

    if (args.isTyping) {
      const now = Date.now()
      const expiresAt = now + 5000 // 5 secondes

      if (existing) {
        // Mettre à jour le timestamp
        await ctx.db.patch(existing._id, {
          startedAt: now,
          expiresAt,
        })
      } else {
        // Créer un nouvel indicateur
        await ctx.db.insert("typingIndicators", {
          conversationId: args.conversationId,
          userId: user._id,
          startedAt: now,
          expiresAt,
        })
      }
    } else {
      // Supprimer l'indicateur
      if (existing) {
        await ctx.db.delete(existing._id)
      }
    }
  },
})

// ============================================
// QUERIES
// ============================================

/**
 * Récupère toutes les conversations de l'utilisateur
 */
export const getMyConversations = query({
  args: {
    sortBy: v.optional(
      v.union(
        v.literal("lastActivity"),
        v.literal("unread"),
        v.literal("pinned"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) return []

    // Récupérer les conversations où l'utilisateur est créateur ou user
    const [asCreator, asUser] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", user._id))
        .collect(),
      ctx.db
        .query("conversations")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect(),
    ])

    // Combiner et filtrer les conversations supprimées
    const allConversations = [...asCreator, ...asUser].filter((conv) => {
      const role = conv.creatorId === user._id ? "creator" : "user"
      return role === "creator" ? !conv.deletedByCreator : !conv.deletedByUser
    })

    // Récupérer les infos des autres participants en batch
    const otherParticipantIds = allConversations.map((conv) =>
      conv.creatorId === user._id ? conv.userId : conv.creatorId,
    )
    const otherParticipants = await Promise.all(
      otherParticipantIds.map((id) => ctx.db.get(id)),
    )
    const participantMap = new Map(
      otherParticipants.map((p, i) => [otherParticipantIds[i], p]),
    )

    // Enrichir les conversations
    const enrichedConversations = allConversations.map((conv) => {
      const role: "creator" | "user" =
        conv.creatorId === user._id ? "creator" : "user"
      const otherParticipant = participantMap.get(
        role === "creator" ? conv.userId : conv.creatorId,
      )
      const unreadCount =
        role === "creator" ? conv.unreadCountCreator : conv.unreadCountUser
      const isPinned =
        role === "creator" ? conv.pinnedByCreator : conv.pinnedByUser
      const isMuted =
        role === "creator" ? conv.mutedByCreator : conv.mutedByUser

      return {
        ...conv,
        role,
        otherParticipant: otherParticipant
          ? {
              _id: otherParticipant._id,
              name: otherParticipant.name,
              username: otherParticipant.username,
              image: otherParticipant.image,
              isOnline: otherParticipant.isOnline,
              lastSeenAt: otherParticipant.lastSeenAt,
              accountType: otherParticipant.accountType,
            }
          : null,
        unreadCount,
        hasUnread: unreadCount > 0,
        isPinned: isPinned ?? false,
        isMuted: isMuted ?? false,
      }
    })

    // Trier selon le critère demandé
    const sortBy = args.sortBy ?? "lastActivity"

    return enrichedConversations.sort((a, b) => {
      // Les épinglés en premier si tri par pinned
      if (sortBy === "pinned") {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
      }

      // Puis par non-lus si demandé
      if (sortBy === "unread") {
        if (a.hasUnread && !b.hasUnread) return -1
        if (!a.hasUnread && b.hasUnread) return 1
      }

      // Enfin par dernière activité
      const aTime = a.lastMessageAt ?? a._creationTime
      const bTime = b.lastMessageAt ?? b._creationTime
      return bTime - aTime
    })
  },
})

/**
 * Récupère les messages d'une conversation avec pagination
 */
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { messages: [], hasMore: false, nextCursor: null }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return { messages: [], hasMore: false, nextCursor: null }
    }

    // Vérifier les permissions
    const permissions = await checkConversationPermissions(
      ctx,
      args.conversationId,
      user._id,
    )

    if (!permissions.canRead) {
      return {
        messages: [],
        hasMore: false,
        nextCursor: null,
        isLocked: permissions.isLocked,
        reason: permissions.reason,
      }
    }

    const limit = args.limit ?? 30

    // Récupérer les messages
    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")

    // Appliquer le curseur si fourni
    if (args.cursor) {
      messagesQuery = messagesQuery.filter((q) =>
        q.lt(q.field("_creationTime"), args.cursor!),
      )
    }

    const messages = await messagesQuery.take(limit + 1)
    const hasMore = messages.length > limit
    const messagesToReturn = messages.slice(0, limit)

    // Récupérer les infos des expéditeurs
    const senderIds = [...new Set(messagesToReturn.map((m) => m.senderId))]
    const senders = await Promise.all(senderIds.map((id) => ctx.db.get(id)))
    const senderMap = new Map(senders.map((s, i) => [senderIds[i], s]))

    // Récupérer les messages de réponse
    const replyIds = messagesToReturn
      .filter((m) => m.replyToMessageId)
      .map((m) => m.replyToMessageId!)
    const replyMessages = await Promise.all(
      replyIds.map((id) => ctx.db.get(id)),
    )
    const replyMap = new Map(replyMessages.map((r, i) => [replyIds[i], r]))

    // Enrichir les messages
    const enrichedMessages = messagesToReturn.map((message) => {
      const sender = senderMap.get(message.senderId)
      const replyTo = message.replyToMessageId
        ? replyMap.get(message.replyToMessageId)
        : null

      return {
        ...message,
        sender: sender
          ? {
              _id: sender._id,
              name: sender.name,
              username: sender.username,
              image: sender.image,
              accountType: sender.accountType,
            }
          : null,
        replyToMessage: replyTo
          ? {
              _id: replyTo._id,
              content: replyTo.isDeleted
                ? "[Message supprimé]"
                : truncateMessagePreview(replyTo.content, 50),
              senderId: replyTo.senderId,
            }
          : null,
      }
    })

    return {
      messages: enrichedMessages.reverse(), // Ordre chronologique
      hasMore,
      nextCursor: hasMore
        ? messagesToReturn[messagesToReturn.length - 1]._creationTime
        : null,
      isLocked: permissions.isLocked,
      canSendMedia: permissions.canSendMedia,
    }
  },
})

/**
 * Récupère les indicateurs de frappe d'une conversation
 */
export const getTypingIndicators = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // Récupérer l'utilisateur actuel pour le filtrer des résultats
    const currentUser = await getAuthenticatedUser(ctx)
    const now = Date.now()

    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect()

    // Filtrer l'utilisateur actuel - on ne veut pas voir notre propre indicateur
    const otherIndicators = indicators.filter(
      (i) => i.userId !== currentUser._id,
    )

    // Récupérer les infos des utilisateurs
    const userIds = otherIndicators.map((i) => i.userId)
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))

    return otherIndicators.map((indicator, index) => ({
      ...indicator,
      user: users[index]
        ? {
            _id: users[index]!._id,
            name: users[index]!.name,
            image: users[index]!.image,
          }
        : null,
    }))
  },
})

/**
 * Compte total des messages non lus
 */
export const getTotalUnreadCount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return 0

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) return 0

    // Récupérer toutes les conversations
    const [asCreator, asUser] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", user._id))
        .collect(),
      ctx.db
        .query("conversations")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect(),
    ])

    // Calculer le total
    let total = 0

    for (const conv of asCreator) {
      if (!conv.deletedByCreator && !conv.mutedByCreator) {
        total += conv.unreadCountCreator
      }
    }

    for (const conv of asUser) {
      if (!conv.deletedByUser && !conv.mutedByUser) {
        total += conv.unreadCountUser
      }
    }

    return total
  },
})

/**
 * Récupère les permissions pour une conversation
 */
export const getConversationPermissionsQuery = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return {
        canSend: false,
        canRead: false,
        canSendMedia: false,
        isLocked: true,
        reason: "not_authenticated" as const,
      }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return {
        canSend: false,
        canRead: false,
        canSendMedia: false,
        isLocked: true,
        reason: "user_not_found" as const,
      }
    }

    return checkConversationPermissions(ctx, args.conversationId, user._id)
  },
})

/**
 * Récupère une conversation par ID
 */
export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) return null

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) return null

    // Vérifier que l'utilisateur est participant (ou admin)
    const role = await getConversationRole(ctx, args.conversationId, user._id)
    const effectiveRole: "creator" | "user" | "admin" = role ?? "admin"

    if (!role && user.accountType !== "SUPERUSER") {
      return null
    }

    // Récupérer l'autre participant
    const otherId =
      conversation.creatorId === user._id
        ? conversation.userId
        : conversation.creatorId
    const otherParticipant = await ctx.db.get(otherId)

    // Calculer les champs selon le rôle
    const isPinned =
      effectiveRole === "creator"
        ? (conversation.pinnedByCreator ?? false)
        : effectiveRole === "user"
          ? (conversation.pinnedByUser ?? false)
          : false
    const isMuted =
      effectiveRole === "creator"
        ? (conversation.mutedByCreator ?? false)
        : effectiveRole === "user"
          ? (conversation.mutedByUser ?? false)
          : false
    const unreadCount =
      effectiveRole === "creator"
        ? conversation.unreadCountCreator
        : effectiveRole === "user"
          ? conversation.unreadCountUser
          : 0

    return {
      ...conversation,
      role: effectiveRole,
      otherParticipant: otherParticipant
        ? {
            _id: otherParticipant._id,
            name: otherParticipant.name,
            username: otherParticipant.username,
            image: otherParticipant.image,
            isOnline: otherParticipant.isOnline,
            lastSeenAt: otherParticipant.lastSeenAt,
            accountType: otherParticipant.accountType,
          }
        : null,
      isPinned,
      isMuted,
      unreadCount,
      hasUnread: unreadCount > 0,
    }
  },
})

// ============================================
// INTERNAL MUTATIONS (pour crons et webhooks)
// ============================================

/**
 * Nettoie les indicateurs de frappe expirés
 */
export const cleanupExpiredTypingIndicators = internalMutation({
  handler: async (ctx) => {
    const now = Date.now()

    const expired = await ctx.db
      .query("typingIndicators")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .collect()

    for (const indicator of expired) {
      await ctx.db.delete(indicator._id)
    }

    return { deleted: expired.length }
  },
})

/**
 * Verrouille une conversation quand l'abonnement messagerie expire
 */
export const lockConversationOnExpiry = internalMutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation || conversation.isLocked) return

    await ctx.db.patch(args.conversationId, {
      isLocked: true,
      lockedAt: Date.now(),
      lockedReason: "subscription_expired",
    })

    // Insérer un message système
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: conversation.userId,
      messageType: "system",
      systemMessageType: "conversation_locked",
    })
  },
})

/**
 * Déverrouille une conversation quand l'abonnement est renouvelé
 */
export const unlockConversationOnRenewal = internalMutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation || !conversation.isLocked) return

    await ctx.db.patch(args.conversationId, {
      isLocked: false,
      lockedAt: undefined,
      lockedReason: undefined,
    })

    // Insérer un message système
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: conversation.userId,
      messageType: "system",
      systemMessageType: "conversation_unlocked",
    })
  },
})

/**
 * Insère un message système dans une conversation
 */
export const insertSystemMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    systemMessageType: v.union(
      v.literal("conversation_started"),
      v.literal("subscription_expired"),
      v.literal("subscription_renewed"),
      v.literal("conversation_locked"),
      v.literal("conversation_unlocked"),
    ),
    senderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      messageType: "system",
      systemMessageType: args.systemMessageType,
    })
  },
})

/**
 * Récupère les contacts disponibles pour démarrer une conversation
 * - Pour les créateurs: leurs abonnés
 * - Pour les utilisateurs: les créateurs auxquels ils sont abonnés (contenu ou messagerie)
 * - Pour les admins: tous les utilisateurs
 */
export const getMessagingContacts = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) return []

    const searchLower = args.search?.toLowerCase().trim()

    // Admin: peut voir tous les utilisateurs
    if (user.accountType === "SUPERUSER") {
      let allUsers = await ctx.db.query("users").collect()

      // Exclure l'utilisateur actuel
      allUsers = allUsers.filter((u) => u._id !== user._id)

      // Filtrer par recherche
      if (searchLower) {
        allUsers = allUsers.filter(
          (u) =>
            u.name?.toLowerCase().includes(searchLower) ||
            u.username?.toLowerCase().includes(searchLower),
        )
      }

      return allUsers.slice(0, 50).map((u) => ({
        _id: u._id,
        name: u.name,
        username: u.username,
        image: u.image,
        isOnline: u.isOnline,
        accountType: u.accountType,
      }))
    }

    // Créateur: voir ses abonnés (actifs ET expirés pour pouvoir les recontacter)
    if (user.accountType === "CREATOR") {
      const subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_creator", (q) => q.eq("creator", user._id))
        // Inclure actifs ET expirés (pour permettre au créateur de recontacter d'anciens abonnés)
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "expired"),
          ),
        )
        .collect()

      const subscriberIds = [...new Set(subscriptions.map((s) => s.subscriber))]
      const subscribers = await Promise.all(
        subscriberIds.map((id) => ctx.db.get(id)),
      )

      let validSubscribers = subscribers.filter(Boolean) as Doc<"users">[]

      // Filtrer par recherche
      if (searchLower) {
        validSubscribers = validSubscribers.filter(
          (u) =>
            u.name?.toLowerCase().includes(searchLower) ||
            u.username?.toLowerCase().includes(searchLower),
        )
      }

      return validSubscribers.slice(0, 50).map((u) => ({
        _id: u._id,
        name: u.name,
        username: u.username,
        image: u.image,
        isOnline: u.isOnline,
        accountType: u.accountType,
      }))
    }

    // Utilisateur normal: voir les créateurs auxquels il est abonné
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber_status", (q) =>
        q.eq("subscriber", user._id).eq("status", "active"),
      )
      .collect()

    // Filtrer les abonnements qui ont accès messagerie (type messaging_access ou les deux)
    const messagingSubscriptions = subscriptions.filter(
      (s) => s.type === "messaging_access" || s.type === "content_access",
    )

    const creatorIds = [
      ...new Set(messagingSubscriptions.map((s) => s.creator)),
    ]
    const creators = await Promise.all(creatorIds.map((id) => ctx.db.get(id)))

    let validCreators = creators.filter(
      (c) => c && c.accountType === "CREATOR",
    ) as Doc<"users">[]

    // Filtrer par recherche
    if (searchLower) {
      validCreators = validCreators.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.username?.toLowerCase().includes(searchLower),
      )
    }

    return validCreators.slice(0, 50).map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      image: u.image,
      isOnline: u.isOnline,
      accountType: u.accountType,
    }))
  },
})
