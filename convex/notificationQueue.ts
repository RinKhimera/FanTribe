/**
 * Notification Queue - Système de fan-out robuste et scalable
 *
 * Ce module gère l'envoi de notifications pour les créateurs avec beaucoup d'abonnés.
 * Au lieu d'envoyer toutes les notifications en une seule mutation (risque de timeout),
 * on utilise une queue persistante qui :
 * 1. Stocke les batches de notifications à envoyer
 * 2. Les traite progressivement via un cron job
 * 3. Gère les erreurs et les retry automatiques
 */
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import {
  MutationCtx,
  internalMutation,
  internalQuery,
} from "./_generated/server"

// Configuration
const BATCH_SIZE = 50 // Notifications par batch dans la queue
const MAX_ATTEMPTS = 3 // Nombre max de tentatives avant échec
const PROCESSING_BATCH_SIZE = 5 // Nombre de jobs à traiter par exécution du cron

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
 * Ajoute des notifications à la queue pour traitement différé
 * Appelé depuis createPost quand le nombre de destinataires dépasse le seuil
 */
export const enqueueNotifications = internalMutation({
  args: {
    type: v.union(
      v.literal("newPost"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("newSubscription"),
      v.literal("renewSubscription"),
      v.literal("subscription_expired"),
    ),
    sender: v.id("users"),
    recipientIds: v.array(v.id("users")),
    post: v.optional(v.id("posts")),
    comment: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const { recipientIds, ...notificationData } = args
    const now = Date.now()

    // Diviser en batches pour éviter les mutations trop volumineuses
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

    console.log(
      `📬 Enqueued ${recipientIds.length} notifications in ${batches.length} batches`,
    )

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
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId)
    if (!batch) {
      console.error("Batch not found:", args.batchId)
      return { success: false, error: "Batch not found" }
    }

    // Vérifier que le batch est en état valide pour traitement
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
        await ctx.db.insert("notifications", {
          type: batch.type,
          recipientId,
          sender: batch.sender,
          post: batch.post,
          comment: batch.comment,
          read: false,
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

    // Mettre à jour le statut
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
 * Nettoie les batches terminés (garde un historique de 7 jours)
 */
export const cleanupCompletedBatches = internalMutation({
  args: {},
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
 * Appelé par le cron job toutes les minutes
 */
export const processNextBatches = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Récupérer les batches en attente (les plus anciens d'abord)
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
          await ctx.db.insert("notifications", {
            type: batch.type,
            recipientId,
            sender: batch.sender,
            post: batch.post,
            comment: batch.comment,
            read: false,
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

      // Mettre à jour le statut du batch
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

    console.log(
      `📬 Processed ${totalProcessed} notifications from ${pendingBatches.length} batches`,
    )

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
 * Récupère les prochains batches à traiter
 */
export const getNextPendingBatches = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
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
 * Utilisé par createPost pour envoyer les notifications
 * Décide automatiquement entre envoi direct et queue selon le volume
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
          await ctx.db.insert("notifications", {
            type: "newPost",
            recipientId,
            sender: data.sender,
            post: data.postId,
            read: false,
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
      sender: data.sender,
      recipientIds: batch,
      post: data.postId,
      status: "pending",
      attempts: 0,
      processedCount: 0,
      createdAt: now,
    })
  }

  console.log(
    `📬 Queued ${data.recipientIds.length} notifications in ${batches.length} batches`,
  )

  return { direct: false, count: data.recipientIds.length }
}
