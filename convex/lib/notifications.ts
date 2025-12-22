import { Id } from "../_generated/dataModel"
import { MutationCtx } from "../_generated/server"

export type NotificationType =
  | "newPost"
  | "like"
  | "comment"
  | "follow"
  | "subscription"
  | "message"

/**
 * Taille des batches pour l'insertion de notifications
 * Convex recommande ~100 écritures par mutation pour éviter les timeouts
 */
export const NOTIFICATION_BATCH_SIZE = 50

/**
 * Seuil au-delà duquel on utilise le fan-out différé (scheduler)
 */
export const FANOUT_THRESHOLD = 200

interface NotificationData {
  type: NotificationType
  recipientId: Id<"users">
  sender: Id<"users">
  post?: Id<"posts">
  comment?: Id<"comments">
}

/**
 * Crée un batch de notifications de manière optimisée
 * Utilisé pour les notifications à faible volume (< FANOUT_THRESHOLD)
 *
 * @example
 * await createNotificationBatch(ctx, {
 *   type: "newPost",
 *   sender: authorId,
 *   post: postId,
 *   recipientIds: followerIds,
 * })
 */
export const createNotificationBatch = async (
  ctx: MutationCtx,
  data: Omit<NotificationData, "recipientId"> & { recipientIds: Id<"users">[] },
): Promise<{ created: number; failed: number }> => {
  const { recipientIds, ...notificationBase } = data
  let created = 0
  let failed = 0

  // Insertion parallèle avec gestion d'erreur individuelle
  await Promise.all(
    recipientIds.map(async (recipientId) => {
      try {
        await ctx.db.insert("notifications", {
          ...notificationBase,
          recipientId,
          read: false,
        })
        created++
      } catch (error) {
        console.error("Notification insert failed", {
          recipientId,
          type: notificationBase.type,
          error,
        })
        failed++
      }
    }),
  )

  return { created, failed }
}

/**
 * Prépare les données pour le fan-out différé
 * Retourne les batches à traiter par le scheduler
 */
export const prepareFanoutBatches = <T>(
  items: T[],
  batchSize: number = NOTIFICATION_BATCH_SIZE,
): T[][] => {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  return batches
}
