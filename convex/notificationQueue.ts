/**
 * Notification Queue - Systeme de fan-out robuste et scalable
 *
 * Ce module gere l'envoi de notifications pour les createurs avec beaucoup d'abonnes.
 * Au lieu d'envoyer toutes les notifications en une seule mutation (risque de timeout),
 * on utilise une queue persistante qui :
 * 1. Stocke les batches de notifications a envoyer
 * 2. Les traite progressivement via un cron job
 * 3. Gere les erreurs et les retry automatiques
 */
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import {
  MutationCtx,
  internalMutation,
  internalQuery,
} from "./_generated/server"
import { createNotification, NotificationType } from "./lib/notifications"

// Configuration
const BATCH_SIZE = 50 // Notifications par batch dans la queue
const MAX_ATTEMPTS = 3 // Nombre max de tentatives avant echec
const PROCESSING_BATCH_SIZE = 5 // Nombre de jobs a traiter par execution du cron

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Divise un tableau en batches de taille fixe
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ============================================================================
// MUTATIONS INTERNES
// ============================================================================

/**
 * Ajoute des notifications a la queue pour traitement differe
 * Appele depuis createPost quand le nombre de destinataires depasse le seuil
 */
export const enqueueNotifications = internalMutation({
  args: {
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("newPost"),
      v.literal("newSubscription"),
      v.literal("renewSubscription"),
      v.literal("subscriptionExpired"),
      v.literal("subscriptionConfirmed"),
      v.literal("creatorApplicationApproved"),
      v.literal("creatorApplicationRejected"),
      v.literal("tip"),
    ),
    actorId: v.id("users"),
    recipientIds: v.array(v.id("users")),
    postId: v.optional(v.id("posts")),
    tipId: v.optional(v.id("tips")),
    commentId: v.optional(v.id("comments")),
    tipAmount: v.optional(v.number()),
    tipCurrency: v.optional(v.string()),
  },
  returns: v.object({
    totalRecipients: v.number(),
    batchCount: v.number(),
    queueIds: v.array(v.id("pendingNotifications")),
  }),
  handler: async (ctx, args) => {
    const { recipientIds, ...notificationData } = args
    const now = Date.now()

    // Diviser en batches pour eviter les mutations trop volumineuses
    const batches = chunkArray(recipientIds, BATCH_SIZE)

    const queueIds: Id<"pendingNotifications">[] = []

    for (const batch of batches) {
      const id = await ctx.db.insert("pendingNotifications", {
        ...notificationData,
        recipientIds: batch,
        status: "pending",
        attempts: 0,
        processedCount: 0,
        createdAt: now,
      })
      queueIds.push(id)
    }

    return {
      totalRecipients: recipientIds.length,
      batchCount: batches.length,
      queueIds,
    }
  },
})

/**
 * Traite un batch de notifications en attente
 */
export const processPendingBatch = internalMutation({
  args: {
    batchId: v.id("pendingNotifications"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    processedCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
    isComplete: v.optional(v.boolean()),
    remainingAttempts: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId)
    if (!batch) {
      console.error("Batch not found:", args.batchId)
      return { success: false, error: "Batch not found" }
    }

    // Verifier que le batch est en etat valide pour traitement
    if (batch.status !== "pending" && batch.status !== "processing") {
      return { success: false, error: `Invalid status: ${batch.status}` }
    }

    // Marquer comme en cours de traitement
    await ctx.db.patch(args.batchId, {
      status: "processing",
      attempts: batch.attempts + 1,
      lastAttemptAt: Date.now(),
    })

    let processedCount = batch.processedCount
    let failedCount = 0

    // Traiter chaque destinataire
    for (const recipientId of batch.recipientIds.slice(processedCount)) {
      try {
        await createNotification(ctx, {
          type: batch.type as NotificationType,
          recipientId,
          actorId: batch.actorId,
          postId: batch.postId,
          commentId: batch.commentId,
          tipId: batch.tipId,
          tipAmount: batch.tipAmount,
          tipCurrency: batch.tipCurrency,
        })
        processedCount++
      } catch (error) {
        console.error("Failed to insert notification:", {
          recipientId,
          error,
        })
        failedCount++
        // Continuer avec les autres destinataires
      }
    }

    // Mettre a jour le statut
    const isComplete = processedCount >= batch.recipientIds.length
    const hasFailed = batch.attempts >= MAX_ATTEMPTS && !isComplete

    await ctx.db.patch(args.batchId, {
      status: isComplete ? "completed" : hasFailed ? "failed" : "pending",
      processedCount,
      errorMessage:
        failedCount > 0 ? `${failedCount} notifications failed` : undefined,
    })

    return {
      success: true,
      processedCount,
      failedCount,
      isComplete,
      remainingAttempts: MAX_ATTEMPTS - batch.attempts,
    }
  },
})

/**
 * Nettoie les batches termines (garde un historique de 7 jours)
 */
export const cleanupCompletedBatches = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    const oldBatches = await ctx.db
      .query("pendingNotifications")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .filter((q) => q.lt(q.field("createdAt"), sevenDaysAgo))
      .take(100)

    for (const batch of oldBatches) {
      await ctx.db.delete(batch._id)
    }

    return { deleted: oldBatches.length }
  },
})

/**
 * Traite les prochains batches en attente
 * Appele par le cron job toutes les minutes
 */
export const processNextBatches = internalMutation({
  args: {},
  returns: v.object({
    processed: v.number(),
    failed: v.optional(v.number()),
    batchesProcessed: v.optional(v.number()),
    message: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    // Recuperer les batches en attente (les plus anciens d'abord)
    const pendingBatches = await ctx.db
      .query("pendingNotifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(PROCESSING_BATCH_SIZE)

    if (pendingBatches.length === 0) {
      return { processed: 0, message: "No pending batches" }
    }

    let totalProcessed = 0
    let totalFailed = 0

    for (const batch of pendingBatches) {
      // Marquer comme en cours de traitement
      await ctx.db.patch(batch._id, {
        status: "processing",
        attempts: batch.attempts + 1,
        lastAttemptAt: Date.now(),
      })

      let processedCount = batch.processedCount
      let failedCount = 0

      // Traiter chaque destinataire
      for (const recipientId of batch.recipientIds.slice(processedCount)) {
        try {
          await createNotification(ctx, {
            type: batch.type as NotificationType,
            recipientId,
            actorId: batch.actorId,
            postId: batch.postId,
            commentId: batch.commentId,
            tipId: batch.tipId,
            tipAmount: batch.tipAmount,
            tipCurrency: batch.tipCurrency,
          })
          processedCount++
        } catch (error) {
          console.error("Failed to insert notification:", {
            recipientId,
            error,
          })
          failedCount++
        }
      }

      // Mettre a jour le statut du batch
      const isComplete = processedCount >= batch.recipientIds.length
      const hasFailed = batch.attempts >= MAX_ATTEMPTS && !isComplete

      await ctx.db.patch(batch._id, {
        status: isComplete ? "completed" : hasFailed ? "failed" : "pending",
        processedCount,
        errorMessage:
          failedCount > 0 ? `${failedCount} notifications failed` : undefined,
      })

      totalProcessed += processedCount - batch.processedCount
      totalFailed += failedCount
    }

    return {
      processed: totalProcessed,
      failed: totalFailed,
      batchesProcessed: pendingBatches.length,
    }
  },
})

// ============================================================================
// QUERIES INTERNES
// ============================================================================

/**
 * Recupere les prochains batches a traiter
 */
export const getNextPendingBatches = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("pendingNotifications"),
      _creationTime: v.number(),
      type: v.union(
        v.literal("like"),
        v.literal("comment"),
        v.literal("newPost"),
        v.literal("newSubscription"),
        v.literal("renewSubscription"),
        v.literal("subscriptionExpired"),
        v.literal("subscriptionConfirmed"),
        v.literal("creatorApplicationApproved"),
        v.literal("creatorApplicationRejected"),
        v.literal("tip"),
      ),
      actorId: v.id("users"),
      recipientIds: v.array(v.id("users")),
      postId: v.optional(v.id("posts")),
      tipId: v.optional(v.id("tips")),
      commentId: v.optional(v.id("comments")),
      tipAmount: v.optional(v.number()),
      tipCurrency: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
      attempts: v.number(),
      lastAttemptAt: v.optional(v.number()),
      processedCount: v.number(),
      errorMessage: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? PROCESSING_BATCH_SIZE

    return await ctx.db
      .query("pendingNotifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc") // Les plus anciens d'abord
      .take(limit)
  },
})

/**
 * Statistiques de la queue
 */
export const getQueueStats = internalQuery({
  args: {},
  returns: v.object({
    pending: v.number(),
    processing: v.number(),
    completed: v.number(),
    failed: v.number(),
    pendingRecipients: v.number(),
  }),
  handler: async (ctx) => {
    const [pending, processing, completed, failed] = await Promise.all([
      ctx.db
        .query("pendingNotifications")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect(),
      ctx.db
        .query("pendingNotifications")
        .withIndex("by_status", (q) => q.eq("status", "processing"))
        .collect(),
      ctx.db
        .query("pendingNotifications")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .collect(),
      ctx.db
        .query("pendingNotifications")
        .withIndex("by_status", (q) => q.eq("status", "failed"))
        .collect(),
    ])

    const pendingRecipients = pending.reduce(
      (sum, b) => sum + b.recipientIds.length,
      0,
    )

    return {
      pending: pending.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length,
      pendingRecipients,
    }
  },
})

// ============================================================================
// HELPER POUR POSTS.TS
// ============================================================================

/**
 * Utilise par createPost pour envoyer les notifications
 * Decide automatiquement entre envoi direct et queue selon le volume
 */
export const sendPostNotifications = async (
  ctx: MutationCtx,
  data: {
    sender: Id<"users">
    postId: Id<"posts">
    recipientIds: Id<"users">[]
    fanoutThreshold?: number
  },
): Promise<{ direct: boolean; count: number }> => {
  const threshold = data.fanoutThreshold ?? 200

  if (data.recipientIds.length <= threshold) {
    // Envoi direct pour petit volume
    let count = 0
    await Promise.all(
      data.recipientIds.map(async (recipientId) => {
        try {
          await createNotification(ctx, {
            type: "newPost",
            recipientId,
            actorId: data.sender,
            postId: data.postId,
          })
          count++
        } catch (error) {
          console.error("Direct notification failed:", { recipientId, error })
        }
      }),
    )
    return { direct: true, count }
  }

  // Queue pour gros volume
  const batches = chunkArray(data.recipientIds, BATCH_SIZE)
  const now = Date.now()

  for (const batch of batches) {
    await ctx.db.insert("pendingNotifications", {
      type: "newPost",
      actorId: data.sender,
      recipientIds: batch,
      postId: data.postId,
      status: "pending",
      attempts: 0,
      processedCount: 0,
      createdAt: now,
    })
  }

  return { direct: false, count: data.recipientIds.length }
}
