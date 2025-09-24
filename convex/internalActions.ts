"use node"

import { v } from "convex/values"
import { deleteBunnyAsset } from "@/lib/bunny"
import { internal } from "./_generated/api"
import { Doc, Id } from "./_generated/dataModel"
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server"

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
        currency,
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
      currency: args.currency,
      status: "succeeded", // si on arrive ici c'est que le provider a confirmé
      provider: args.provider,
      providerTransactionId: args.providerTransactionId,
    })
    return { transactionId: txId as Id<"transactions"> }
  },
})

export const processPayment = action({
  args: {
    provider: v.string(), // 'cinetpay'
    providerTransactionId: v.string(),
    creatorId: v.id("users"),
    subscriberId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    subscriptionType: v.optional(v.string()), // future
    paymentMethod: v.optional(v.string()),
    startedAt: v.optional(v.string()), // ISO
  },
  handler: async (ctx, args): Promise<ProcessPaymentResult> => {
    const {
      provider,
      providerTransactionId,
      creatorId,
      subscriberId,
      amount,
      currency,
      paymentMethod,
      startedAt,
    } = args

    // 1. Idempotence: transaction déjà enregistrée ?
    const existingTx = await ctx.runQuery(
      internal.internalActions.getTransactionByProviderTransactionId,
      { providerTransactionId },
    )
    if (existingTx) {
      const sub = await ctx.runQuery(
        internal.internalActions.getSubscriptionById,
        {
          subscriptionId: existingTx.subscriptionId,
        },
      )
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

    // 2. Appliquer paiement à la souscription
    const startMs = startedAt ? Date.parse(startedAt) : Date.now()
    const durationMs = 30 * 24 * 60 * 60 * 1000 // 30 jours
    const subResult = await ctx.runMutation(
      internal.internalActions.applySubscriptionPayment,
      {
        creatorId,
        subscriberId,
        amountPaid: amount,
        startMs,
        durationMs,
        currency: currency.toUpperCase(),
      },
    )

    // 3. Enregistrer la transaction (idempotent)
    const txResult = await ctx.runMutation(
      internal.internalActions.recordTransactionIfAbsent,
      {
        subscriptionId: subResult.subscriptionId,
        providerTransactionId,
        provider,
        amount,
        currency: currency.toUpperCase(),
        subscriberId,
        creatorId,
        paymentMethod,
      },
    )

    return {
      success: true,
      message: "Payment processed",
      subscriptionId: subResult.subscriptionId,
      status: "active",
      action: subResult.action,
      renewalCount: subResult.renewalCount,
      previousEndDate: subResult.previousEndDate,
      newEndDate: subResult.newEndDate,
      transactionId: txResult.transactionId,
      providerTransactionId,
      provider,
    }
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
      const result = await deleteBunnyAsset(args.mediaId, args.assetType)

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
    const axios = require("axios")

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

    const results = []

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
            const deleteResponse = await axios.delete(
              `https://video.bunnycdn.com/library/${videoLibraryId}/videos/${videoGuid}`,
              {
                headers: {
                  AccessKey: videoAccessKey,
                },
              },
            )

            results.push({
              url: mediaUrl,
              type: "video",
              guid: videoGuid,
              success: true,
              status: deleteResponse.status,
            })
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
          const match = mediaUrl.match(/https:\/\/[^\/]+\/(.+)/)
          const filePath = match ? match[1] : null

          if (filePath) {
            // Supprimer l'image via l'API Bunny Storage
            const deleteResponse = await axios.delete(
              `https://storage.bunnycdn.com/${storageZoneName}/${filePath}`,
              {
                headers: {
                  AccessKey: storageAccessKey,
                },
              },
            )

            results.push({
              url: mediaUrl,
              type: "image",
              filePath: filePath,
              success: true,
              status: deleteResponse.status,
            })
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
