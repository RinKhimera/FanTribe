import { Id } from "../_generated/dataModel"
import { MutationCtx, QueryCtx } from "../_generated/server"

type DbCtx = QueryCtx | MutationCtx

export type SubscriptionType = "content_access" | "messaging_access"
export type SubscriptionStatus = "active" | "expired" | "canceled" | "pending"

/**
 * Récupère les IDs des créateurs auxquels un utilisateur est abonné activement
 *
 * @example
 * const creatorIds = await getActiveSubscribedCreatorIds(ctx, userId, "content_access")
 */
export const getActiveSubscribedCreatorIds = async (
  ctx: DbCtx,
  subscriberId: Id<"users">,
  type: SubscriptionType = "content_access",
): Promise<Set<Id<"users">>> => {
  const now = Date.now()
  const subs = await ctx.db
    .query("subscriptions")
    .withIndex("by_subscriber_type", (q) =>
      q.eq("subscriber", subscriberId).eq("type", type),
    )
    .collect()

  // Verifier status ET endDate pour eviter la fenetre entre expiration reelle
  // et execution du cron journalier
  return new Set(
    subs
      .filter((s) => s.status === "active" && s.endDate > now)
      .map((s) => s.creator),
  )
}

/**
 * Vérifie si un utilisateur a un abonnement actif à un créateur
 * Verifie status === "active" ET endDate > now pour eviter la fenetre
 * entre expiration reelle et execution du cron journalier
 */
export const hasActiveSubscription = async (
  ctx: DbCtx,
  subscriberId: Id<"users">,
  creatorId: Id<"users">,
  type: SubscriptionType = "content_access",
): Promise<boolean> => {
  const now = Date.now()
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_creator_subscriber", (q) =>
      q.eq("creator", creatorId).eq("subscriber", subscriberId),
    )
    .filter((q) => q.eq(q.field("type"), type))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first()

  return sub !== null && sub.endDate > now
}

/**
 * Récupère les abonnés d'un créateur avec un statut spécifique
 *
 * @example
 * const activeSubscribers = await getCreatorSubscribers(ctx, creatorId, ["active"])
 * const allSubscribers = await getCreatorSubscribers(ctx, creatorId, ["active", "expired"])
 */
export const getCreatorSubscribers = async (
  ctx: DbCtx,
  creatorId: Id<"users">,
  statuses: SubscriptionStatus[] = ["active"],
  type: SubscriptionType = "content_access",
): Promise<Id<"users">[]> => {
  const subs = await ctx.db
    .query("subscriptions")
    .withIndex("by_creator_type", (q) =>
      q.eq("creator", creatorId).eq("type", type),
    )
    .collect()

  const statusSet = new Set(statuses)
  return [
    ...new Set(
      subs
        .filter((s) => statusSet.has(s.status))
        .map((s) => s.subscriber)
        .filter((id) => id !== creatorId), // Exclure le créateur lui-même
    ),
  ]
}

/**
 * Vérifie si un utilisateur peut voir du contenu "subscribers_only"
 * Prend en compte : propriétaire, abonné actif, superuser
 */
export const canViewSubscribersOnlyContent = async (
  ctx: DbCtx,
  viewerId: Id<"users">,
  creatorId: Id<"users">,
  viewerAccountType: "USER" | "CREATOR" | "SUPERUSER",
): Promise<boolean> => {
  // Le propriétaire peut toujours voir son contenu
  if (viewerId === creatorId) return true

  // Les superusers voient tout
  if (viewerAccountType === "SUPERUSER") return true

  // Vérifier l'abonnement actif
  return hasActiveSubscription(ctx, viewerId, creatorId, "content_access")
}

/**
 * Filtre les médias d'un post selon les droits d'accès du viewer.
 * SECURITE: Ne retourne JAMAIS les URLs aux utilisateurs non autorisés.
 * @returns medias filtrés, flag isMediaLocked, et mediaCount original
 */
export const filterPostMediasForViewer = async (
  ctx: DbCtx,
  post: {
    medias?: Array<{ type: string; url: string; mediaId: string; mimeType: string }>
    visibility?: string
    author: Id<"users">
  },
  viewerId: Id<"users"> | null,
  viewerAccountType?: "USER" | "CREATOR" | "SUPERUSER",
): Promise<{ medias: typeof post.medias & []; isMediaLocked: boolean; mediaCount: number }> => {
  const originalMedias = post.medias || []
  const mediaCount = originalMedias.length

  // Contenu public = accès libre
  if (!post.visibility || post.visibility === "public") {
    return { medias: originalMedias as typeof post.medias & [], isMediaLocked: false, mediaCount }
  }

  // Pas de viewer authentifié = contenu verrouillé
  if (!viewerId) {
    return { medias: [] as typeof post.medias & [], isMediaLocked: true, mediaCount }
  }

  // Propriétaire voit toujours son contenu
  if (post.author === viewerId) {
    return { medias: originalMedias as typeof post.medias & [], isMediaLocked: false, mediaCount }
  }

  // Superuser voit tout
  if (viewerAccountType === "SUPERUSER") {
    return { medias: originalMedias as typeof post.medias & [], isMediaLocked: false, mediaCount }
  }

  // Vérifier l'abonnement pour subscribers_only
  const hasAccess = await hasActiveSubscription(
    ctx,
    viewerId,
    post.author,
    "content_access",
  )

  return hasAccess
    ? { medias: originalMedias as typeof post.medias & [], isMediaLocked: false, mediaCount }
    : { medias: [] as typeof post.medias & [], isMediaLocked: true, mediaCount }
}
