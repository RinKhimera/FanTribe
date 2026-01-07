import { Id } from "../_generated/dataModel"
import { MutationCtx, QueryCtx } from "../_generated/server"
import { hasActiveSubscription } from "./subscriptions"

type DbCtx = QueryCtx | MutationCtx

// ============================================
// Types pour les permissions de messagerie
// ============================================

export type MessagingPermission = {
  canSend: boolean
  canRead: boolean
  canSendMedia: boolean
  isLocked: boolean
  reason?: MessagingPermissionReason
  requiresSubscription?: boolean
  requiresContentSubscription?: boolean
}

export type MessagingPermissionReason =
  | "user_not_found"
  | "creator_to_creator_blocked"
  | "no_content_subscription"
  | "no_messaging_subscription"
  | "conversation_locked"
  | "admin_blocked"
  | "not_participant"
  | "not_allowed"

// ============================================
// Vérification des permissions de messagerie
// ============================================

/**
 * Vérifie si un utilisateur peut envoyer des messages à un autre utilisateur
 *
 * Matrice de permissions :
 * - User → Creator     : Seulement si abo "messaging_access" actif (et "content_access" requis)
 * - Creator → User     : Toujours autorisé
 * - Creator → Creator  : INTERDIT
 * - Admin → Anyone     : Toujours autorisé
 */
export const checkMessagingPermission = async (
  ctx: DbCtx,
  senderId: Id<"users">,
  recipientId: Id<"users">,
): Promise<MessagingPermission> => {
  const [sender, recipient] = await Promise.all([
    ctx.db.get(senderId),
    ctx.db.get(recipientId),
  ])

  if (!sender || !recipient) {
    return {
      canSend: false,
      canRead: false,
      canSendMedia: false,
      isLocked: false,
      reason: "user_not_found",
    }
  }

  // SUPERUSER peut toujours envoyer des messages à n'importe qui
  if (sender.accountType === "SUPERUSER") {
    return {
      canSend: true,
      canRead: true,
      canSendMedia: true,
      isLocked: false,
    }
  }

  // Créateur ne peut PAS envoyer de messages à un autre créateur
  if (
    sender.accountType === "CREATOR" &&
    recipient.accountType === "CREATOR"
  ) {
    return {
      canSend: false,
      canRead: false,
      canSendMedia: false,
      isLocked: false,
      reason: "creator_to_creator_blocked",
    }
  }

  // Créateur peut toujours envoyer des messages à ses abonnés (users)
  if (sender.accountType === "CREATOR" && recipient.accountType === "USER") {
    return {
      canSend: true,
      canRead: true,
      canSendMedia: true, // Créateurs peuvent envoyer des médias
      isLocked: false,
    }
  }

  // User → Creator : requiert abonnements content_access ET messaging_access
  if (sender.accountType === "USER" && recipient.accountType === "CREATOR") {
    // D'abord vérifier l'abonnement contenu (prérequis)
    const hasContentSub = await hasActiveSubscription(
      ctx,
      senderId,
      recipientId,
      "content_access",
    )

    if (!hasContentSub) {
      return {
        canSend: false,
        canRead: false,
        canSendMedia: false,
        isLocked: true,
        reason: "no_content_subscription",
        requiresContentSubscription: true,
        requiresSubscription: true,
      }
    }

    // Ensuite vérifier l'abonnement messagerie
    const hasMessagingSub = await hasActiveSubscription(
      ctx,
      senderId,
      recipientId,
      "messaging_access",
    )

    if (!hasMessagingSub) {
      return {
        canSend: false,
        canRead: false,
        canSendMedia: false,
        isLocked: true,
        reason: "no_messaging_subscription",
        requiresSubscription: true,
      }
    }

    // User peut envoyer uniquement du texte (pas de médias)
    return {
      canSend: true,
      canRead: true,
      canSendMedia: false, // Users ne peuvent PAS envoyer de médias
      isLocked: false,
    }
  }

  // Cas par défaut : pas de permission
  return {
    canSend: false,
    canRead: false,
    canSendMedia: false,
    isLocked: false,
    reason: "not_allowed",
  }
}

/**
 * Vérifie si un utilisateur peut envoyer des médias
 * Seuls les CREATORS et SUPERUSERS peuvent envoyer des médias
 */
export const canSendMedia = async (
  ctx: DbCtx,
  userId: Id<"users">,
): Promise<boolean> => {
  const user = await ctx.db.get(userId)
  return user?.accountType === "CREATOR" || user?.accountType === "SUPERUSER"
}

/**
 * Vérifie si un utilisateur est participant d'une conversation
 */
export const isConversationParticipant = async (
  ctx: DbCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
): Promise<boolean> => {
  const conversation = await ctx.db.get(conversationId)
  if (!conversation) return false

  return conversation.creatorId === userId || conversation.userId === userId
}

/**
 * Récupère le rôle d'un utilisateur dans une conversation
 * Retourne "creator", "user", ou null si pas participant
 */
export const getConversationRole = async (
  ctx: DbCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
): Promise<"creator" | "user" | null> => {
  const conversation = await ctx.db.get(conversationId)
  if (!conversation) return null

  if (conversation.creatorId === userId) return "creator"
  if (conversation.userId === userId) return "user"
  return null
}

/**
 * Vérifie les permissions complètes pour une conversation existante
 * Inclut la vérification du verrouillage de la conversation
 */
export const checkConversationPermissions = async (
  ctx: DbCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
): Promise<MessagingPermission> => {
  const conversation = await ctx.db.get(conversationId)
  if (!conversation) {
    return {
      canSend: false,
      canRead: false,
      canSendMedia: false,
      isLocked: false,
      reason: "not_participant",
    }
  }

  const user = await ctx.db.get(userId)
  if (!user) {
    return {
      canSend: false,
      canRead: false,
      canSendMedia: false,
      isLocked: false,
      reason: "user_not_found",
    }
  }

  const role = await getConversationRole(ctx, conversationId, userId)
  if (!role) {
    // SUPERUSER peut voir toutes les conversations
    if (user.accountType === "SUPERUSER") {
      return {
        canSend: true,
        canRead: true,
        canSendMedia: true,
        isLocked: conversation.isLocked,
      }
    }
    return {
      canSend: false,
      canRead: false,
      canSendMedia: false,
      isLocked: false,
      reason: "not_participant",
    }
  }

  // Vérifier si bloqué par admin
  if (conversation.blockedByAdmin) {
    return {
      canSend: false,
      canRead: true, // Peut encore lire l'historique
      canSendMedia: false,
      isLocked: true,
      reason: "admin_blocked",
    }
  }

  // Si c'est le créateur, il peut toujours envoyer
  if (role === "creator") {
    return {
      canSend: true,
      canRead: true,
      canSendMedia: true,
      isLocked: conversation.isLocked, // Info pour l'UI
    }
  }

  // Si c'est le user et la conversation est verrouillée
  if (role === "user" && conversation.isLocked) {
    return {
      canSend: false,
      canRead: false,
      canSendMedia: false,
      isLocked: true,
      reason: conversation.lockedReason === "subscription_expired"
        ? "no_messaging_subscription"
        : "admin_blocked",
      requiresSubscription: conversation.lockedReason === "subscription_expired",
    }
  }

  // User avec conversation non verrouillée - vérifier l'abo messagerie
  const hasMessagingSub = await hasActiveSubscription(
    ctx,
    userId,
    conversation.creatorId,
    "messaging_access",
  )

  if (!hasMessagingSub) {
    return {
      canSend: false,
      canRead: false,
      canSendMedia: false,
      isLocked: true,
      reason: "no_messaging_subscription",
      requiresSubscription: true,
    }
  }

  return {
    canSend: true,
    canRead: true,
    canSendMedia: false, // Users ne peuvent pas envoyer de médias
    isLocked: false,
  }
}

/**
 * Tronque le contenu d'un message pour le preview
 */
export const truncateMessagePreview = (
  content: string | undefined,
  maxLength: number = 100,
): string => {
  if (!content) return ""
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength - 3) + "..."
}

/**
 * Détermine l'autre participant d'une conversation
 */
export const getOtherParticipant = async (
  ctx: DbCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
): Promise<Id<"users"> | null> => {
  const conversation = await ctx.db.get(conversationId)
  if (!conversation) return null

  if (conversation.creatorId === userId) return conversation.userId
  if (conversation.userId === userId) return conversation.creatorId
  return null
}
