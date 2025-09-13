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

export const deleteCloudinaryAsset = action({
  args: {
    publicId: v.string(),
  },
  handler: async (ctx, args) => {
    const cloudinary = require("cloudinary").v2

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })

    try {
      const result = await cloudinary.uploader.destroy(args.publicId, {
        invalidate: true,
      })
      return { success: true, result }
    } catch (error) {
      console.error(`Error deleting asset ${args.publicId}:`, error)
      return { success: false, error: String(error) }
    }
  },
})

export const deleteCloudinaryAssetFromUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const cloudinary = require("cloudinary").v2

      cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      })

      const publicId = extractPublicIdFromUrl(args.url)

      if (!publicId) {
        return {
          success: false,
          error: "Could not extract publicId from URL",
          url: args.url,
        }
      }

      const resourceType = args.url.includes("/video/") ? "video" : "image"

      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: resourceType,
      })

      return {
        success: true,
        result,
        publicId,
        resourceType,
        originalUrl: args.url,
      }
    } catch (error) {
      console.error(`Error deleting asset from URL ${args.url}:`, error)
      return {
        success: false,
        error: String(error),
        url: args.url,
      }
    }
  },
})

const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Nettoyer l'URL des paramètres de query
    const cleanUrl = url.split("?")[0]

    const patterns = [
      // Pattern standard avec version
      /\/(?:image|video|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.\/]+)?$/,
      // Pattern avec transformations
      /\/(?:image|video|raw)\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?(.+?)(?:\.[^.\/]+)?$/,
      // Pattern sans version
      /\/(?:image|video|raw)\/upload\/(.+?)(?:\.[^.\/]+)?$/,
      // Pattern général de fallback
      /\/upload\/(?:.*\/)?(.+?)(?:\.[^.\/]+)?$/,
    ]

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    console.error("Error extracting publicId from URL:", error)
    return null
  }
}

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
