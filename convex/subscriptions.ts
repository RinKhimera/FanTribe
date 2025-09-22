import { ConvexError, v } from "convex/values"
import { Id } from "./_generated/dataModel"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server"

// Helper récupération user courant
const getCurrentUser = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError("Not authenticated")
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique()
  if (!user) throw new ConvexError("User not found")
  return user
}

// PUBLIC: obtenir la souscription entre deux utilisateurs (content_access par défaut)
export const getFollowSubscription = query({
  args: { creatorId: v.id("users"), subscriberId: v.id("users") },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", args.creatorId).eq("subscriber", args.subscriberId),
      )
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .first()
    return sub || null
  },
})

// PUBLIC: liste des souscriptions d'un abonné (content_access)
export const listSubscriberSubscriptions = query({
  args: { subscriberId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber", (q) => q.eq("subscriber", args.subscriberId))
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .collect()
  },
})

// PUBLIC: liste des abonnés d'un créateur (content_access)
export const listCreatorSubscribers = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_creator", (q) => q.eq("creator", args.creatorId))
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .collect()
  },
})

// PUBLIC: annuler une souscription (passe à canceled)
export const cancelSubscription = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const sub = await ctx.db.get(args.subscriptionId)
    if (!sub) throw new ConvexError("Subscription not found")
    if (sub.subscriber !== user._id && sub.creator !== user._id) {
      throw new ConvexError("Unauthorized")
    }
    if (sub.status === "canceled")
      return { canceled: false, reason: "Already canceled" }
    await ctx.db.patch(sub._id, {
      status: "canceled",
      lastUpdateTime: Date.now(),
    })
    return { canceled: true }
  },
})

// INTERNAL: mutation pour créer/renouveler/relancer une souscription lors d'un paiement
export const followUser = internalMutation({
  args: {
    transactionId: v.string(), // provider transaction id
    creatorId: v.id("users"),
    subscriberId: v.id("users"),
    startDate: v.string(), // ISO date
    amountPaid: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const periodDays = 30 // durée de souscription
    const startMs = Date.parse(args.startDate) || Date.now()
    const now = Date.now()

    // Chercher souscription existante
    let sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", args.creatorId).eq("subscriber", args.subscriberId),
      )
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .first()

    let renewed = false
    let reactivated = false

    if (!sub) {
      const newSubId = await ctx.db.insert("subscriptions", {
        subscriber: args.subscriberId,
        creator: args.creatorId,
        startDate: startMs,
        endDate: startMs + periodDays * 24 * 60 * 60 * 1000,
        amountPaid: args.amountPaid ?? 0,
        currency: "EUR",
        renewalCount: 0,
        lastUpdateTime: now,
        type: "content_access",
        status: "active",
      })
      sub = (await ctx.db.get(newSubId))!
    } else {
      // Souscription existante
      if (sub.status === "active" && sub.endDate > now) {
        // Renouvellement: étendre endDate
        const newEnd = sub.endDate + periodDays * 24 * 60 * 60 * 1000
        await ctx.db.patch(sub._id, {
          endDate: newEnd,
          renewalCount: sub.renewalCount + 1,
          lastUpdateTime: now,
        })
        renewed = true
      } else {
        // Réactivation (expirée / canceled / pending)
        await ctx.db.patch(sub._id, {
          startDate: startMs,
          endDate: startMs + periodDays * 24 * 60 * 60 * 1000,
          status: "active",
          renewalCount: sub.renewalCount + 1,
          lastUpdateTime: now,
        })
        reactivated = true
      }
    }

    // Enregistrer transaction (si pas déjà présente)
    const existingTx = await ctx.db
      .query("transactions")
      .withIndex("by_subscriber", (q) =>
        q.eq("subscriberId", args.subscriberId),
      )
      .filter((q) => q.eq(q.field("providerTransactionId"), args.transactionId))
      .first()
    if (!existingTx) {
      await ctx.db.insert("transactions", {
        subscriptionId: sub._id as Id<"subscriptions">,
        subscriberId: args.subscriberId,
        creatorId: args.creatorId,
        amount: args.amountPaid ?? 0,
        currency: "EUR",
        status: "succeeded",
        provider: "stripe",
        providerTransactionId: args.transactionId,
      })
    }

    return {
      subscriptionId: sub._id as Id<"subscriptions">,
      renewed,
      reactivated,
    }
  },
})

// INTERNAL: retrouver une souscription via transaction provider id
export const getSubscriptionByTransactionId = internalQuery({
  args: { transactionId: v.string() },
  handler: async (ctx, args) => {
    // Recherche transaction (scan limité par index subscriber/creator si nécessaire)
    const tx = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("providerTransactionId"), args.transactionId))
      .first()
    if (!tx) return null
    const sub = await ctx.db.get(tx.subscriptionId)
    return sub || null
  },
})

// INTERNAL: cron pour marquer les souscriptions expirées
export const checkAndUpdateExpiredSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    // Récupérer les actives (index by_status)
    const active = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()

    let updated = 0
    for (const s of active) {
      if (s.endDate <= now) {
        await ctx.db.patch(s._id, { status: "expired", lastUpdateTime: now })
        updated++
      }
    }
    return { scanned: active.length, expiredUpdated: updated }
  },
})

export const getMyContentAccessSubscriptionsStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    // Souscriptions où l'utilisateur est abonné (subscriber)
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber", (q) => q.eq("subscriber", user._id))
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .collect()

    if (subs.length === 0)
      return { subscriptions: [], creatorsCount: 0, postsCount: 0 }

    const creatorIds = [...new Set(subs.map((s) => s.creator))]
    // Récupération posts pour chaque creator (compte seulement)
    let postsCount = 0
    for (const creatorId of creatorIds) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("author", creatorId))
        .collect()
      postsCount += posts.length
    }

    // Enrichir créateurs
    const creators = await Promise.all(creatorIds.map((id) => ctx.db.get(id)))
    const creatorMap = new Map(creatorIds.map((id, i) => [id, creators[i]]))

    const enriched = subs.map((s) => ({
      ...s,
      creatorUser: creatorMap.get(s.creator),
    }))

    return {
      subscriptions: enriched,
      creatorsCount: creatorIds.length,
      postsCount,
    }
  },
})

export const getMySubscribersStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    // Souscriptions où l'utilisateur est le créateur
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator", (q) => q.eq("creator", user._id))
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .collect()

    if (subs.length === 0)
      return { subscribers: [], subscribersCount: 0, postsCount: 0 }

    const subscriberIds = [...new Set(subs.map((s) => s.subscriber))]
    // Compter les posts de tous les abonnés
    let postsCount = 0
    for (const subId of subscriberIds) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("author", subId))
        .collect()
      postsCount += posts.length
    }

    const users = await Promise.all(subscriberIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(subscriberIds.map((id, i) => [id, users[i]]))

    const enriched = subs.map((s) => ({
      ...s,
      subscriberUser: userMap.get(s.subscriber),
    }))

    return {
      subscribers: enriched,
      subscribersCount: subscriberIds.length,
      postsCount,
    }
  },
})

export const canUserSubscribe = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    let canSubscribe = true
    let reason: string | null = null
    let currentUser = null

    try {
      currentUser = await getCurrentUser(ctx)
    } catch (e) {
      return { canSubscribe: false, reason: "not_authenticated" }
    }

    if (currentUser._id === args.creatorId) {
      return { canSubscribe: false, reason: "self" }
    }

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", args.creatorId).eq("subscriber", currentUser._id),
      )
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .first()

    if (existing) {
      if (existing.status === "active") {
        canSubscribe = false
        reason = "already_active"
      } else if (existing.status === "pending") {
        canSubscribe = false
        reason = "pending"
      } else if (
        existing.status === "canceled" &&
        existing.endDate > Date.now()
      ) {
        // période encore valable
        canSubscribe = false
        reason = "still_valid_until_expiry"
      }
    }

    return { canSubscribe, reason }
  },
})
