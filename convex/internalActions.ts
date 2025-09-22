"use node"

import { v } from "convex/values"
import { internal } from "./_generated/api"
import { Doc, Id } from "./_generated/dataModel"
import { action } from "./_generated/server"

type ProcessPaymentResult = {
  success: boolean
  message: string
  subscriptionId: Id<"subscriptions">
  status?: string
  alreadyExists?: boolean
  renewed?: boolean
  reactivated?: boolean
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

export const processPayment = action({
  args: {
    transactionId: v.string(),
    creatorId: v.id("users"),
    subscriberId: v.id("users"),
    startDate: v.string(),
    amountPaid: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ProcessPaymentResult> => {
    // Vérifie d'abord si cette transaction existe déjà
    const subscription: Doc<"subscriptions"> | null = await ctx.runQuery(
      internal.subscriptions.getSubscriptionByTransactionId,
      {
        transactionId: args.transactionId,
      },
    )

    if (subscription) {
      return {
        success: true,
        message: "Transaction already processed",
        subscriptionId: subscription._id,
        status: subscription.status,
        alreadyExists: true,
      }
    }

    // Si la transaction n'existe pas, traite le paiement
    const result: {
      subscriptionId: Id<"subscriptions">
      renewed: boolean
      reactivated: boolean
    } = await ctx.runMutation(internal.subscriptions.followUser, {
      transactionId: args.transactionId,
      creatorId: args.creatorId,
      subscriberId: args.subscriberId,
      startDate: args.startDate,
      amountPaid: args.amountPaid,
    })

    return {
      success: true,
      message: "Transaction processed successfully",
      ...result,
      alreadyExists: false,
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

export const deleteBunnyAssets = action({
  args: {
    mediaUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const axios = require("axios")

    const storageAccessKey = process.env.BUNNY_STORAGE_ACCESS_KEY
    const storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME
    const videoLibraryId = process.env.BUNNY_VIDEO_LIBRARY_ID
    const videoAccessKey = process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY

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
