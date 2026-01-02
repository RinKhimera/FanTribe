import { ConvexError, v } from "convex/values"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"

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
    const user = await getAuthenticatedUser(ctx)
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

// INTERNAL: cron pour marquer les souscriptions expirées et notifier les utilisateurs
export const checkAndUpdateExpiredSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    // Use new index by_status_endDate for more efficient filtering
    const active = await ctx.db
      .query("subscriptions")
      .withIndex("by_status_endDate", (q) => q.eq("status", "active"))
      .collect()

    // Filter expired subscriptions in memory
    const expired = active.filter((s) => s.endDate <= now)

    if (expired.length === 0) {
      return { scanned: active.length, expiredUpdated: 0, notified: 0 }
    }

    // Batch update: patches and notifications in parallel
    await Promise.all([
      // Batch patch all expired subscriptions
      ...expired.map((s) =>
        ctx.db.patch(s._id, { status: "expired", lastUpdateTime: now })
      ),
      // Batch insert notifications
      ...expired.map((s) =>
        ctx.db.insert("notifications", {
          type: "subscription_expired",
          recipientId: s.subscriber,
          sender: s.creator,
          read: false,
        })
      ),
    ])

    return {
      scanned: active.length,
      expiredUpdated: expired.length,
      notified: expired.length,
    }
  },
})

export const getMyContentAccessSubscriptionsStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx)
    // Souscriptions où l'utilisateur est abonné (subscriber)
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber", (q) => q.eq("subscriber", user._id))
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .collect()

    if (subs.length === 0)
      return { subscriptions: [], creatorsCount: 0, postsCount: 0 }

    const creatorIds = [...new Set(subs.map((s) => s.creator))]

    // Parallel fetch: creators + post counts
    const [creators, postCounts] = await Promise.all([
      Promise.all(creatorIds.map((id) => ctx.db.get(id))),
      Promise.all(
        creatorIds.map(async (creatorId) => {
          // TODO: Ideally denormalize postsCount in userStats table
          const posts = await ctx.db
            .query("posts")
            .withIndex("by_author", (q) => q.eq("author", creatorId))
            .collect()
          return posts.length
        })
      ),
    ])

    const postsCount = postCounts.reduce((a, b) => a + b, 0)
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
    const user = await getAuthenticatedUser(ctx)
    // Souscriptions où l'utilisateur est le créateur
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator", (q) => q.eq("creator", user._id))
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .collect()

    if (subs.length === 0)
      return { subscribers: [], subscribersCount: 0, postsCount: 0 }

    const subscriberIds = [...new Set(subs.map((s) => s.subscriber))]

    // Parallel fetch: subscribers + post counts
    const [users, postCounts] = await Promise.all([
      Promise.all(subscriberIds.map((id) => ctx.db.get(id))),
      Promise.all(
        subscriberIds.map(async (subId) => {
          // TODO: Ideally denormalize postsCount in userStats table
          const posts = await ctx.db
            .query("posts")
            .withIndex("by_author", (q) => q.eq("author", subId))
            .collect()
          return posts.length
        })
      ),
    ])

    const postsCount = postCounts.reduce((a, b) => a + b, 0)
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
      currentUser = await getAuthenticatedUser(ctx)
    } catch {
      return { canSubscribe: false, reason: "not_authenticated" }
    }

    if (currentUser._id === args.creatorId) {
      return { canSubscribe: false, reason: "self" }
    }

    // Vérifier que le créateur est bien un CREATOR
    const creator = await ctx.db.get(args.creatorId)
    if (!creator || creator.accountType !== "CREATOR") {
      return { canSubscribe: false, reason: "not_creator" }
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
