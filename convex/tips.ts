import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { internalMutation, query } from "./_generated/server"
import { requireCreator } from "./lib/auth"
import {
  TIP_CREATOR_RATE,
  TIP_MESSAGE_MAX_LENGTH,
  USD_TO_XAF_RATE,
} from "./lib/constants"

// ============================================================================
// Types
// ============================================================================

type ProcessTipResult = {
  success: boolean
  message: string
  tipId: Id<"tips"> | null
  alreadyProcessed?: boolean
}

const ProcessTipResultValidator = v.object({
  success: v.boolean(),
  message: v.string(),
  tipId: v.union(v.id("tips"), v.null()),
  alreadyProcessed: v.optional(v.boolean()),
})

// ============================================================================
// Internal Mutations
// ============================================================================

/**
 * Traitement atomique d'un pourboire — appelé par les webhooks via internalActions.
 * Idempotent : vérifie l'index by_providerTransactionId avant insertion.
 */
export const processTipAtomic = internalMutation({
  args: {
    provider: v.string(),
    providerTransactionId: v.string(),
    senderId: v.id("users"),
    creatorId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    message: v.optional(v.string()),
    context: v.optional(
      v.union(
        v.literal("post"),
        v.literal("profile"),
        v.literal("message"),
      ),
    ),
    postId: v.optional(v.id("posts")),
    conversationId: v.optional(v.id("conversations")),
  },
  returns: ProcessTipResultValidator,
  handler: async (ctx, args): Promise<ProcessTipResult> => {
    // 1. IDEMPOTENCE: vérifier si le tip a déjà été traité
    const existingTip = await ctx.db
      .query("tips")
      .withIndex("by_providerTransactionId", (q) =>
        q.eq("providerTransactionId", args.providerTransactionId),
      )
      .first()

    if (existingTip) {
      return {
        success: true,
        message: "Tip already processed",
        tipId: existingTip._id,
        alreadyProcessed: true,
      }
    }

    // 2. Valider que le créateur existe et est CREATOR
    const creator = await ctx.db.get(args.creatorId)
    if (!creator || creator.accountType !== "CREATOR") {
      return {
        success: false,
        message: "Cannot tip non-creator user",
        tipId: null,
        alreadyProcessed: false,
      }
    }

    // 3. Valider que sender ≠ creator
    if (args.senderId === args.creatorId) {
      return {
        success: false,
        message: "Cannot tip yourself",
        tipId: null,
        alreadyProcessed: false,
      }
    }

    // 4. Tronquer le message si présent
    const tipMessage = args.message?.slice(0, TIP_MESSAGE_MAX_LENGTH)

    // 5. INSÉRER LE TIP
    const tipId = await ctx.db.insert("tips", {
      senderId: args.senderId,
      creatorId: args.creatorId,
      amount: args.amount,
      currency: args.currency.toUpperCase() as "XAF" | "USD",
      message: tipMessage,
      status: "succeeded",
      provider: args.provider,
      providerTransactionId: args.providerTransactionId,
      context: args.context,
      postId: args.postId,
      conversationId: args.conversationId,
    })

    // 6. NOTIFICATION pour le créateur
    await ctx.db.insert("notifications", {
      type: "tip",
      recipientId: args.creatorId,
      sender: args.senderId,
      read: false,
      tip: tipId,
      post: args.postId,
    })

    // 7. MISE À JOUR des stats créateur
    const normalizedAmount =
      args.currency.toUpperCase() === "USD"
        ? args.amount * USD_TO_XAF_RATE
        : args.amount

    const existingStats = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", args.creatorId))
      .unique()

    if (existingStats) {
      await ctx.db.patch(existingStats._id, {
        tipsReceived: (existingStats.tipsReceived ?? 0) + 1,
        totalTipsAmount:
          (existingStats.totalTipsAmount ?? 0) + normalizedAmount,
        lastUpdated: Date.now(),
      })
    } else {
      await ctx.db.insert("userStats", {
        userId: args.creatorId,
        postsCount: 0,
        subscribersCount: 0,
        totalLikes: 0,
        tipsReceived: 1,
        totalTipsAmount: normalizedAmount,
        lastUpdated: Date.now(),
      })
    }

    return {
      success: true,
      message: "Tip processed successfully",
      tipId,
      alreadyProcessed: false,
    }
  },
})

// ============================================================================
// Queries
// ============================================================================

/**
 * Récupère les revenus de pourboires pour un créateur.
 * Utilisé sur la page revenus.
 */
export const getCreatorTipEarnings = query({
  args: {},
  returns: v.object({
    totalTipsGross: v.number(),
    totalTipsNet: v.number(),
    tipCount: v.number(),
    recentTips: v.array(
      v.object({
        _id: v.id("tips"),
        _creationTime: v.number(),
        amount: v.number(),
        currency: v.union(v.literal("XAF"), v.literal("USD")),
        message: v.optional(v.string()),
        context: v.optional(
          v.union(
            v.literal("post"),
            v.literal("profile"),
            v.literal("message"),
          ),
        ),
        sender: v.union(
          v.object({
            _id: v.id("users"),
            name: v.string(),
            username: v.optional(v.string()),
            image: v.string(),
          }),
          v.null(),
        ),
      }),
    ),
    currency: v.string(),
  }),
  handler: async (ctx) => {
    const currentUser = await requireCreator(ctx)

    const tips = await ctx.db
      .query("tips")
      .withIndex("by_creator_status", (q) =>
        q.eq("creatorId", currentUser._id).eq("status", "succeeded"),
      )
      .take(5000)

    const normalizeToXAF = (amount: number, currency: string): number => {
      if (currency.toUpperCase() === "USD") return amount * USD_TO_XAF_RATE
      return amount
    }

    const totalTipsGross = tips.reduce(
      (sum, tip) => sum + normalizeToXAF(tip.amount, tip.currency),
      0,
    )
    const totalTipsNet = totalTipsGross * TIP_CREATOR_RATE

    // 20 tips les plus récents avec info sender
    const recentTipDocs = tips
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 20)

    // Batch fetch senders (pattern N+1 prevention)
    const senderIds = [...new Set(recentTipDocs.map((t) => t.senderId))]
    const senders = await Promise.all(senderIds.map((id) => ctx.db.get(id)))
    const senderMap = new Map(
      senders.filter(Boolean).map((s) => [s!._id, s!]),
    )

    const recentTips = recentTipDocs.map((tip) => {
      const sender = senderMap.get(tip.senderId)
      return {
        _id: tip._id,
        _creationTime: tip._creationTime,
        amount: tip.amount,
        currency: tip.currency,
        message: tip.message,
        context: tip.context,
        sender: sender
          ? {
              _id: sender._id,
              name: sender.name,
              username: sender.username,
              image: sender.image,
            }
          : null,
      }
    })

    return {
      totalTipsGross: Math.round(totalTipsGross),
      totalTipsNet: Math.round(totalTipsNet),
      tipCount: tips.length,
      recentTips,
      currency: "XAF",
    }
  },
})
