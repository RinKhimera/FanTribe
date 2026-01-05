import { v } from "convex/values"
import { internal } from "./_generated/api"
import { Doc, Id } from "./_generated/dataModel"
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server"
import { incrementUserStat } from "./userStats"

// Helper pour supprimer un asset Bunny depuis Convex
async function deleteBunnyAssetFromConvex(
  mediaId: string,
  type: "image" | "video",
): Promise<{ success: boolean; message: string; statusCode: number }> {
  // Récupérer les variables d'environnement Convex
  const BUNNY_VIDEO_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID
  const BUNNY_VIDEO_ACCESS_KEY = process.env.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY
  const BUNNY_STORAGE_ZONE_NAME =
    process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME
  const BUNNY_STORAGE_ACCESS_KEY =
    process.env.NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY

  if (type === "video") {
    if (!BUNNY_VIDEO_LIBRARY_ID || !BUNNY_VIDEO_ACCESS_KEY) {
      console.error("❌ Bunny video credentials missing in Convex env")
      return {
        success: false,
        message: "Configuration Bunny CDN manquante",
        statusCode: 500,
      }
    }

    try {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${BUNNY_VIDEO_LIBRARY_ID}/videos/${mediaId}`,
        {
          method: "DELETE",
          headers: { AccessKey: BUNNY_VIDEO_ACCESS_KEY },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("❌ Bunny video deletion failed:", data)
        return {
          success: false,
          message: data.message || "Erreur lors de la suppression",
          statusCode: response.status,
        }
      }

      console.log("✅ Bunny video deleted:", mediaId)
      return { success: true, message: "Vidéo supprimée", statusCode: 200 }
    } catch (error) {
      console.error("❌ Bunny video deletion error:", error)
      return {
        success: false,
        message: "Erreur réseau",
        statusCode: 500,
      }
    }
  }

  if (type === "image") {
    if (!BUNNY_STORAGE_ZONE_NAME || !BUNNY_STORAGE_ACCESS_KEY) {
      console.error("❌ Bunny storage credentials missing in Convex env")
      return {
        success: false,
        message: "Configuration Bunny CDN manquante",
        statusCode: 500,
      }
    }

    try {
      const response = await fetch(
        `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE_NAME}/${mediaId}`,
        {
          method: "DELETE",
          headers: { AccessKey: BUNNY_STORAGE_ACCESS_KEY },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Bunny image deletion failed:", errorText)
        return {
          success: false,
          message: errorText || "Erreur lors de la suppression",
          statusCode: response.status,
        }
      }

      console.log("✅ Bunny image deleted:", mediaId)
      return { success: true, message: "Image supprimée", statusCode: 200 }
    } catch (error) {
      console.error("❌ Bunny image deletion error:", error)
      return {
        success: false,
        message: "Erreur réseau",
        statusCode: 500,
      }
    }
  }

  return {
    success: false,
    message: "Type d'asset invalide",
    statusCode: 400,
  }
}

type ProcessPaymentResult = {
  success: boolean
  message: string
  subscriptionId: Id<"subscriptions"> | null
  status?: string
  alreadyProcessed?: boolean
  action?: "created" | "renewed" | "reactivated" | "noop"
  renewalCount?: number
  previousEndDate?: number
  newEndDate?: number
  transactionId?: Id<"transactions">
  providerTransactionId?: string
  provider?: string
}

type CheckTransactionResult = {
  exists: boolean
  transactionId: string
  subscriptionId?: Id<"subscriptions">
  status?: string
  details?: {
    creator?: Id<"users">
    subscriber?: Id<"users">
    startDate?: number
    endDate?: number
    amountPaid?: number
  }
}

// Internal query pour retrouver une transaction par providerTransactionId
export const getTransactionByProviderTransactionId = internalQuery({
  args: { providerTransactionId: v.string() },
  handler: async (ctx, args) => {
    const tx = await ctx.db
      .query("transactions")
      .withIndex("by_providerTransactionId", (q) =>
        q.eq("providerTransactionId", args.providerTransactionId),
      )
      .first()
    return tx || null
  },
})

// Internal query simple pour récupérer une souscription par id
export const getSubscriptionById = internalQuery({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.subscriptionId)
    return sub || null
  },
})

// Internal mutation: applique le paiement sur la souscription (création, renouvellement, réactivation)
export const applySubscriptionPayment = internalMutation({
  args: {
    creatorId: v.id("users"),
    subscriberId: v.id("users"),
    amountPaid: v.number(),
    startMs: v.number(),
    durationMs: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const {
      creatorId,
      subscriberId,
      amountPaid,
      startMs,
      durationMs,
      currency,
    } = args

    // Vérifier que le créateur est bien un CREATOR
    const creator = await ctx.db.get(creatorId)
    if (!creator || creator.accountType !== "CREATOR") {
      throw new Error("Cannot subscribe to non-creator user")
    }

    let sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", creatorId).eq("subscriber", subscriberId),
      )
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .first()

    let action: "created" | "renewed" | "reactivated" | "noop" = "noop"
    let previousEndDate: number | undefined
    let newEndDate: number | undefined
    let renewalCount: number | undefined

    if (!sub) {
      const newSubId = await ctx.db.insert("subscriptions", {
        subscriber: subscriberId,
        creator: creatorId,
        startDate: startMs,
        endDate: startMs + durationMs,
        amountPaid: amountPaid,
        currency: currency.toUpperCase() as "XAF" | "USD",
        renewalCount: 0,
        lastUpdateTime: now,
        type: "content_access",
        status: "active",
      })
      sub = (await ctx.db.get(newSubId))!
      action = "created"
      previousEndDate = sub.endDate
      newEndDate = sub.endDate
      renewalCount = 0

      // Mise à jour incrémentale des stats du créateur (nouvel abonné)
      await incrementUserStat(ctx, creatorId, { subscribersCount: 1 })
    } else {
      previousEndDate = sub.endDate
      if (sub.status === "active" && sub.endDate > now) {
        // Renouvellement
        newEndDate = sub.endDate + durationMs
        await ctx.db.patch(sub._id, {
          endDate: newEndDate,
          renewalCount: sub.renewalCount + 1,
          lastUpdateTime: now,
        })
        action = "renewed"
        renewalCount = sub.renewalCount + 1
        // Pas de mise à jour des stats: l'abonné était déjà actif
      } else {
        // Réactivation
        newEndDate = startMs + durationMs
        await ctx.db.patch(sub._id, {
          startDate: startMs,
          endDate: newEndDate,
          renewalCount: sub.renewalCount + 1,
          lastUpdateTime: now,
          status: "active",
        })
        action = "reactivated"
        renewalCount = sub.renewalCount + 1

        // Mise à jour incrémentale des stats du créateur (réactivation)
        await incrementUserStat(ctx, creatorId, { subscribersCount: 1 })
      }
    }

    return {
      subscriptionId: sub._id as Id<"subscriptions">,
      action,
      previousEndDate,
      newEndDate,
      renewalCount,
    }
  },
})

// Internal mutation: enregistre la transaction si absente (idempotent)
export const recordTransactionIfAbsent = internalMutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    providerTransactionId: v.string(),
    provider: v.string(),
    amount: v.number(),
    currency: v.string(),
    subscriberId: v.id("users"),
    creatorId: v.id("users"),
    rawPayload: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_providerTransactionId", (q) =>
        q.eq("providerTransactionId", args.providerTransactionId),
      )
      .first()
    if (existing) return { transactionId: existing._id as Id<"transactions"> }

    const txId = await ctx.db.insert("transactions", {
      subscriptionId: args.subscriptionId,
      subscriberId: args.subscriberId,
      creatorId: args.creatorId,
      amount: args.amount,
      currency: args.currency.toUpperCase() as "XAF" | "USD",
      status: "succeeded", // si on arrive ici c'est que le provider a confirmé
      provider: args.provider,
      providerTransactionId: args.providerTransactionId,
    })
    return { transactionId: txId as Id<"transactions"> }
  },
})

/**
 * Mutation ATOMIQUE pour traiter un paiement de souscription.
 * Combine la verification d'idempotence, l'application du paiement sur la souscription,
 * et l'enregistrement de la transaction dans une seule mutation.
 *
 * Cela evite les race conditions entre le webhook et l'URL de retour qui
 * pourraient arriver en meme temps.
 */
export const processPaymentAtomic = internalMutation({
  args: {
    provider: v.string(),
    providerTransactionId: v.string(),
    creatorId: v.id("users"),
    subscriberId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    startedAt: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ProcessPaymentResult> => {
    const {
      provider,
      providerTransactionId,
      creatorId,
      subscriberId,
      amount,
      currency,
      startedAt,
    } = args

    const now = Date.now()
    const startMs = startedAt ? Date.parse(startedAt) : now
    const durationMs = 30 * 24 * 60 * 60 * 1000 // 30 jours

    // 1. IDEMPOTENCE: Verifier si la transaction existe deja (ATOMIQUE)
    const existingTx = await ctx.db
      .query("transactions")
      .withIndex("by_providerTransactionId", (q) =>
        q.eq("providerTransactionId", providerTransactionId),
      )
      .first()

    if (existingTx) {
      // Transaction deja traitee, recuperer la souscription
      const sub = await ctx.db.get(existingTx.subscriptionId)
      return {
        success: true,
        message: "Already processed",
        subscriptionId: sub?._id || null,
        status: sub?.status,
        alreadyProcessed: true,
        action: "noop",
        renewalCount: sub?.renewalCount,
        previousEndDate: sub?.endDate,
        newEndDate: sub?.endDate,
        transactionId: existingTx._id as Id<"transactions">,
        providerTransactionId,
        provider,
      }
    }

    // Vérifier que le créateur est bien un CREATOR
    const creator = await ctx.db.get(creatorId)
    if (!creator || creator.accountType !== "CREATOR") {
      return {
        success: false,
        message: "Cannot subscribe to non-creator user",
        subscriptionId: null,
        alreadyProcessed: false,
        action: "noop",
        transactionId: undefined,
        providerTransactionId,
        provider,
      }
    }

    // 2. APPLIQUER LE PAIEMENT SUR LA SOUSCRIPTION
    let sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", creatorId).eq("subscriber", subscriberId),
      )
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .first()

    let action: "created" | "renewed" | "reactivated" | "noop" = "noop"
    let previousEndDate: number | undefined
    let newEndDate: number | undefined
    let renewalCount: number | undefined

    if (!sub) {
      // Nouvelle souscription
      const newSubId = await ctx.db.insert("subscriptions", {
        subscriber: subscriberId,
        creator: creatorId,
        startDate: startMs,
        endDate: startMs + durationMs,
        amountPaid: amount,
        currency: currency.toUpperCase() as "XAF" | "USD",
        renewalCount: 0,
        lastUpdateTime: now,
        type: "content_access",
        status: "active",
      })
      sub = (await ctx.db.get(newSubId))!
      action = "created"
      previousEndDate = sub.endDate
      newEndDate = sub.endDate
      renewalCount = 0

      // Mise à jour incrémentale des stats du créateur (nouvel abonné)
      await incrementUserStat(ctx, creatorId, { subscribersCount: 1 })
    } else {
      previousEndDate = sub.endDate
      if (sub.status === "active" && sub.endDate > now) {
        // Renouvellement: etendre la date de fin
        newEndDate = sub.endDate + durationMs
        await ctx.db.patch(sub._id, {
          endDate: newEndDate,
          renewalCount: sub.renewalCount + 1,
          lastUpdateTime: now,
        })
        action = "renewed"
        renewalCount = sub.renewalCount + 1
        // Pas de mise à jour des stats: l'abonné était déjà actif
      } else {
        // Reactivation: reset les dates
        newEndDate = startMs + durationMs
        await ctx.db.patch(sub._id, {
          startDate: startMs,
          endDate: newEndDate,
          renewalCount: sub.renewalCount + 1,
          lastUpdateTime: now,
          status: "active",
        })
        action = "reactivated"
        renewalCount = sub.renewalCount + 1

        // Mise à jour incrémentale des stats du créateur (réactivation)
        await incrementUserStat(ctx, creatorId, { subscribersCount: 1 })
      }
    }

    // 3. ENREGISTRER LA TRANSACTION
    const txId = await ctx.db.insert("transactions", {
      subscriptionId: sub._id as Id<"subscriptions">,
      subscriberId,
      creatorId,
      amount,
      currency: currency.toUpperCase() as "XAF" | "USD",
      status: "succeeded",
      provider,
      providerTransactionId,
    })

    // 4. CREER LA NOTIFICATION POUR LE CREATEUR
    if (
      action === "created" ||
      action === "renewed" ||
      action === "reactivated"
    ) {
      const notificationType =
        action === "created" ? "newSubscription" : "renewSubscription"
      await ctx.db.insert("notifications", {
        type: notificationType,
        recipientId: creatorId,
        sender: subscriberId,
        read: false,
      })
    }

    return {
      success: true,
      message: "Payment processed",
      subscriptionId: sub._id as Id<"subscriptions">,
      status: "active",
      action,
      renewalCount,
      previousEndDate,
      newEndDate,
      transactionId: txId as Id<"transactions">,
      providerTransactionId,
      provider,
    }
  },
})

/**
 * Action publique pour traiter un paiement.
 * Delegue le traitement a la mutation atomique processPaymentAtomic
 * pour eviter les race conditions.
 *
 * @deprecated Utiliser processPaymentAtomic directement depuis les fonctions Convex.
 * Cette action est conservee pour la compatibilite avec les webhooks externes.
 */
export const processPayment = action({
  args: {
    provider: v.string(),
    providerTransactionId: v.string(),
    creatorId: v.id("users"),
    subscriberId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    subscriptionType: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    startedAt: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ProcessPaymentResult> => {
    // Deleguer a la mutation atomique pour eviter les race conditions
    return await ctx.runMutation(
      internal.internalActions.processPaymentAtomic,
      {
        provider: args.provider,
        providerTransactionId: args.providerTransactionId,
        creatorId: args.creatorId,
        subscriberId: args.subscriberId,
        amount: args.amount,
        currency: args.currency,
        paymentMethod: args.paymentMethod,
        startedAt: args.startedAt,
      },
    )
  },
})

export const checkTransaction = action({
  args: {
    transactionId: v.string(),
  },
  handler: async (ctx, args): Promise<CheckTransactionResult> => {
    // Vérifie si cette transaction existe
    const subscription: Doc<"subscriptions"> | null = await ctx.runQuery(
      internal.subscriptions.getSubscriptionByTransactionId,
      {
        transactionId: args.transactionId,
      },
    )

    if (!subscription) {
      return {
        exists: false,
        transactionId: args.transactionId,
      }
    }

    // La transaction existe, retourne les détails pertinents
    return {
      exists: true,
      transactionId: args.transactionId,
      subscriptionId: subscription._id,
      status: subscription.status,
      details: {
        creator: subscription.creator,
        subscriber: subscription.subscriber,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        amountPaid: subscription.amountPaid,
      },
    }
  },
})

export const fanoutNewPostNotifications = action({
  args: {
    authorId: v.id("users"),
    postId: v.id("posts"),
    recipientIds: v.array(v.id("users")),
    chunkSize: v.optional(v.number()),
    delayMsBetweenChunks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const chunkSize = args.chunkSize ?? 200
    const delay = args.delayMsBetweenChunks ?? 1000

    let inserted = 0
    let chunks = 0

    for (let i = 0; i < args.recipientIds.length; i += chunkSize) {
      const slice = args.recipientIds.slice(i, i + chunkSize)
      chunks++

      await Promise.all(
        slice.map((recipientId) =>
          ctx
            .runMutation(internal.notifications.insertNewPostNotification, {
              recipientId,
              sender: args.authorId,
              postId: args.postId,
            })
            .catch((err) => {
              console.error("fanout newPost notification failed", {
                recipientId,
                postId: args.postId,
                err,
              })
            }),
        ),
      )

      inserted += slice.length

      if (delay > 0 && i + chunkSize < args.recipientIds.length) {
        await new Promise((res) => setTimeout(res, delay))
      }
    }

    return {
      total: args.recipientIds.length,
      inserted,
      chunks,
      chunkSize,
      delayed: delay > 0,
    }
  },
})

export const deleteSingleBunnyAsset = internalAction({
  args: {
    mediaId: v.string(),
    assetType: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    try {
      const result = await deleteBunnyAssetFromConvex(
        args.mediaId,
        args.assetType,
      )

      return {
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
      }
    } catch (error) {
      console.error("❌ Erreur dans deleteSingleBunnyAsset:", error)
      return {
        success: false,
        message: "Erreur interne lors de la suppression",
        statusCode: 500,
      }
    }
  },
})

export const deleteMultipleBunnyAssets = action({
  args: {
    mediaUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const storageAccessKey = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY
    const storageZoneName = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME
    const videoLibraryId = process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID
    const videoAccessKey = process.env.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY

    if (
      !storageAccessKey ||
      !storageZoneName ||
      !videoLibraryId ||
      !videoAccessKey
    ) {
      console.error("❌ Variables d'environnement Bunny.net manquantes")
      return {
        total: args.mediaUrls.length,
        success: 0,
        failures: args.mediaUrls.length,
        results: args.mediaUrls.map((url) => ({
          url,
          success: false,
          error: "Missing Bunny.net environment variables",
        })),
      }
    }

    const results: Array<{
      url: string
      type?: "image" | "video"
      guid?: string | null
      filePath?: string | null
      success: boolean
      status?: number
      error?: string
    }> = []

    for (const mediaUrl of args.mediaUrls) {
      try {
        // Déterminer si c'est une image ou une vidéo
        const isVideo = mediaUrl.startsWith(
          "https://iframe.mediadelivery.net/embed/",
        )

        if (isVideo) {
          // Extraire le GUID de la vidéo
          const guidMatch = mediaUrl.match(/\/embed\/\d+\/([^?/]+)/)
          const videoGuid = guidMatch ? guidMatch[1] : null

          if (videoGuid) {
            // Supprimer la vidéo via l'API Bunny Stream
            const res = await fetch(
              `https://video.bunnycdn.com/library/${videoLibraryId}/videos/${videoGuid}`,
              {
                method: "DELETE",
                headers: {
                  AccessKey: videoAccessKey,
                } as Record<string, string>,
              },
            )

            if (res.ok) {
              results.push({
                url: mediaUrl,
                type: "video",
                guid: videoGuid,
                success: true,
                status: res.status,
              })
            } else {
              results.push({
                url: mediaUrl,
                type: "video",
                guid: videoGuid,
                success: false,
                status: res.status,
                error: `Bunny Stream DELETE failed: ${res.status} ${res.statusText}`,
              })
            }
          } else {
            console.error(`❌ Impossible d'extraire le GUID de: ${mediaUrl}`)
            results.push({
              url: mediaUrl,
              type: "video",
              success: false,
              error: "Could not extract video GUID from URL",
            })
          }
        } else {
          // C'est une image - extraire le chemin complet (userId/filename)
          const match = mediaUrl.match(/https:\/\/[^/]+\/(.+)/)
          const filePath = match ? match[1] : null

          if (filePath) {
            // Supprimer l'image via l'API Bunny Storage
            const res = await fetch(
              `https://storage.bunnycdn.com/${storageZoneName}/${filePath}`,
              {
                method: "DELETE",
                headers: {
                  AccessKey: storageAccessKey,
                } as Record<string, string>,
              },
            )

            if (res.ok) {
              results.push({
                url: mediaUrl,
                type: "image",
                filePath: filePath,
                success: true,
                status: res.status,
              })
            } else {
              results.push({
                url: mediaUrl,
                type: "image",
                filePath: filePath,
                success: false,
                status: res.status,
                error: `Bunny Storage DELETE failed: ${res.status} ${res.statusText}`,
              })
            }
          } else {
            console.error(`❌ Impossible d'extraire le chemin de: ${mediaUrl}`)
            results.push({
              url: mediaUrl,
              type: "image",
              success: false,
              error: "Could not extract file path from URL",
            })
          }
        }
      } catch (error) {
        console.error(`❌ Erreur suppression ${mediaUrl}:`, error)
        results.push({
          url: mediaUrl,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return {
      total: args.mediaUrls.length,
      success: successCount,
      failures: failureCount,
      results,
    }
  },
})
