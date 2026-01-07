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

    // Batch fetch: creators + userStats (utilise postsCount dénormalisé)
    const [creators, creatorStats] = await Promise.all([
      Promise.all(creatorIds.map((id) => ctx.db.get(id))),
      Promise.all(
        creatorIds.map((creatorId) =>
          ctx.db
            .query("userStats")
            .withIndex("by_userId", (q) => q.eq("userId", creatorId))
            .unique(),
        ),
      ),
    ])

    // Somme des postsCount depuis userStats (0 si pas de stats)
    const postsCount = creatorStats.reduce(
      (sum, stats) => sum + (stats?.postsCount ?? 0),
      0,
    )
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

    // Batch fetch: subscribers + userStats (utilise postsCount dénormalisé)
    const [users, subscriberStats] = await Promise.all([
      Promise.all(subscriberIds.map((id) => ctx.db.get(id))),
      Promise.all(
        subscriberIds.map((subId) =>
          ctx.db
            .query("userStats")
            .withIndex("by_userId", (q) => q.eq("userId", subId))
            .unique(),
        ),
      ),
    ])

    // Somme des postsCount depuis userStats (0 si pas de stats)
    const postsCount = subscriberStats.reduce(
      (sum, stats) => sum + (stats?.postsCount ?? 0),
      0,
    )
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

// ============================================
// ABONNEMENTS MESSAGERIE (messaging_access)
// ============================================

/**
 * Vérifie si l'utilisateur peut acheter un abonnement messagerie
 * Prérequis : doit avoir un abonnement contenu actif
 */
export const canBuyMessagingSubscription = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    let currentUser = null

    try {
      currentUser = await getAuthenticatedUser(ctx)
    } catch {
      return {
        canBuy: false,
        reason: "not_authenticated",
        suggestBundle: false,
        hasContentSubscription: false,
        hasMessagingSubscription: false,
      }
    }

    if (currentUser._id === args.creatorId) {
      return {
        canBuy: false,
        reason: "self",
        suggestBundle: false,
        hasContentSubscription: false,
        hasMessagingSubscription: false,
      }
    }

    // Vérifier que le créateur est bien un CREATOR
    const creator = await ctx.db.get(args.creatorId)
    if (!creator || creator.accountType !== "CREATOR") {
      return {
        canBuy: false,
        reason: "not_creator",
        suggestBundle: false,
        hasContentSubscription: false,
        hasMessagingSubscription: false,
      }
    }

    const now = Date.now()

    // Vérifier l'abonnement contenu (prérequis)
    const contentSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", args.creatorId).eq("subscriber", currentUser._id),
      )
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .first()

    const hasActiveContentSub =
      contentSub &&
      contentSub.status === "active" &&
      contentSub.endDate > now

    // Vérifier l'abonnement messagerie existant
    const messagingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", args.creatorId).eq("subscriber", currentUser._id),
      )
      .filter((q) => q.eq(q.field("type"), "messaging_access"))
      .first()

    const hasActiveMessagingSub =
      messagingSub &&
      messagingSub.status === "active" &&
      messagingSub.endDate > now

    // Si pas d'abo contenu, suggérer le bundle
    if (!hasActiveContentSub) {
      return {
        canBuy: false,
        reason: "content_subscription_required",
        suggestBundle: true,
        hasContentSubscription: false,
        hasMessagingSubscription: hasActiveMessagingSub ?? false,
      }
    }

    // Si déjà un abo messagerie actif
    if (hasActiveMessagingSub) {
      return {
        canBuy: false,
        reason: "already_active",
        suggestBundle: false,
        hasContentSubscription: true,
        hasMessagingSubscription: true,
        expiresAt: messagingSub?.endDate,
      }
    }

    // Si abo messagerie pending
    if (messagingSub && messagingSub.status === "pending") {
      return {
        canBuy: false,
        reason: "pending",
        suggestBundle: false,
        hasContentSubscription: true,
        hasMessagingSubscription: false,
      }
    }

    return {
      canBuy: true,
      reason: null,
      suggestBundle: false,
      hasContentSubscription: true,
      hasMessagingSubscription: false,
    }
  },
})

/**
 * Récupère l'abonnement messagerie entre deux utilisateurs
 */
export const getMessagingSubscription = query({
  args: { creatorId: v.id("users"), subscriberId: v.id("users") },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", args.creatorId).eq("subscriber", args.subscriberId),
      )
      .filter((q) => q.eq(q.field("type"), "messaging_access"))
      .first()
    return sub || null
  },
})

/**
 * Récupère le statut des abonnements (contenu + messagerie) avec un créateur
 */
export const getSubscriptionStatus = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    let currentUser = null

    try {
      currentUser = await getAuthenticatedUser(ctx)
    } catch {
      return {
        hasContentAccess: false,
        hasMessagingAccess: false,
        contentSubscription: null,
        messagingSubscription: null,
      }
    }

    const now = Date.now()

    // Récupérer les deux types d'abonnements en parallèle
    const [contentSub, messagingSub] = await Promise.all([
      ctx.db
        .query("subscriptions")
        .withIndex("by_creator_subscriber", (q) =>
          q.eq("creator", args.creatorId).eq("subscriber", currentUser._id),
        )
        .filter((q) => q.eq(q.field("type"), "content_access"))
        .first(),
      ctx.db
        .query("subscriptions")
        .withIndex("by_creator_subscriber", (q) =>
          q.eq("creator", args.creatorId).eq("subscriber", currentUser._id),
        )
        .filter((q) => q.eq(q.field("type"), "messaging_access"))
        .first(),
    ])

    return {
      hasContentAccess:
        contentSub !== null &&
        contentSub.status === "active" &&
        contentSub.endDate > now,
      hasMessagingAccess:
        messagingSub !== null &&
        messagingSub.status === "active" &&
        messagingSub.endDate > now,
      contentSubscription: contentSub,
      messagingSubscription: messagingSub,
    }
  },
})

/**
 * Récupère le statut détaillé des abonnements pour la modale de messagerie
 * Utilisé pour déterminer quel type de paiement proposer
 */
export const getSubscriptionStatusForMessaging = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    let currentUser = null

    try {
      currentUser = await getAuthenticatedUser(ctx)
    } catch {
      return {
        hasContentAccess: false,
        hasMessagingAccess: false,
        contentExpiry: null,
        messagingExpiry: null,
        scenario: "not_authenticated" as const,
        suggestBundle: false,
      }
    }

    const now = Date.now()

    // Récupérer les deux types d'abonnements en parallèle
    const [contentSub, messagingSub] = await Promise.all([
      ctx.db
        .query("subscriptions")
        .withIndex("by_creator_subscriber", (q) =>
          q.eq("creator", args.creatorId).eq("subscriber", currentUser._id),
        )
        .filter((q) => q.eq(q.field("type"), "content_access"))
        .first(),
      ctx.db
        .query("subscriptions")
        .withIndex("by_creator_subscriber", (q) =>
          q.eq("creator", args.creatorId).eq("subscriber", currentUser._id),
        )
        .filter((q) => q.eq(q.field("type"), "messaging_access"))
        .first(),
    ])

    const hasContentAccess =
      contentSub !== null &&
      contentSub.status === "active" &&
      contentSub.endDate > now

    const hasMessagingAccess =
      messagingSub !== null &&
      messagingSub.status === "active" &&
      messagingSub.endDate > now

    // Déterminer le scénario pour la modale
    let scenario:
      | "both_active"
      | "messaging_missing"
      | "content_missing"
      | "both_missing"
      | "not_authenticated"

    if (hasContentAccess && hasMessagingAccess) {
      scenario = "both_active"
    } else if (hasContentAccess && !hasMessagingAccess) {
      scenario = "messaging_missing"
    } else if (!hasContentAccess && hasMessagingAccess) {
      scenario = "content_missing"
    } else {
      scenario = "both_missing"
    }

    return {
      hasContentAccess,
      hasMessagingAccess,
      contentExpiry: contentSub?.endDate ?? null,
      messagingExpiry: messagingSub?.endDate ?? null,
      scenario,
      suggestBundle: scenario === "both_missing",
      // Prix pour la modale
      prices: {
        contentAccess: 1000, // XAF / 1 mois
        messagingAccess: 2000, // XAF / 2 semaines
        bundle: 3500, // XAF / Pack Complet (1 mois chaque)
        bundleSavings: 1500, // Économie
      },
    }
  },
})

/**
 * INTERNAL: Vérifie et verrouille les conversations des abonnements messagerie expirés
 */
export const checkAndLockExpiredMessagingSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    // Récupérer les abonnements messagerie actifs qui viennent d'expirer
    const activeSubs = await ctx.db
      .query("subscriptions")
      .withIndex("by_status_endDate", (q) => q.eq("status", "active"))
      .collect()

    // Filtrer les abonnements messagerie expirés
    const expiredMessagingSubs = activeSubs.filter(
      (s) => s.type === "messaging_access" && s.endDate <= now,
    )

    if (expiredMessagingSubs.length === 0) {
      return { processed: 0 }
    }

    // Pour chaque abonnement expiré, verrouiller la conversation correspondante
    const results = await Promise.all(
      expiredMessagingSubs.map(async (sub) => {
        // Mettre à jour le statut de l'abonnement
        await ctx.db.patch(sub._id, {
          status: "expired",
          lastUpdateTime: now,
        })

        // Trouver la conversation entre ce subscriber et ce creator
        const conversation = await ctx.db
          .query("conversations")
          .withIndex("by_participants", (q) =>
            q.eq("creatorId", sub.creator).eq("userId", sub.subscriber),
          )
          .first()

        // Ignorer les conversations initiées par admin (requiresSubscription: false)
        // Ces conversations ne doivent jamais être verrouillées
        if (
          conversation &&
          !conversation.isLocked &&
          conversation.requiresSubscription !== false
        ) {
          // Verrouiller la conversation
          await ctx.db.patch(conversation._id, {
            isLocked: true,
            lockedAt: now,
            lockedReason: "subscription_expired",
          })

          // Insérer un message système
          await ctx.db.insert("messages", {
            conversationId: conversation._id,
            senderId: sub.subscriber,
            messageType: "system",
            systemMessageType: "subscription_expired",
          })

          // Créer une notification pour le user
          await ctx.db.insert("notifications", {
            type: "messaging_subscription_expired",
            recipientId: sub.subscriber,
            sender: sub.creator,
            read: false,
            conversation: conversation._id,
          })

          return { subscriptionId: sub._id, conversationLocked: true }
        }

        return { subscriptionId: sub._id, conversationLocked: false }
      }),
    )

    return {
      processed: expiredMessagingSubs.length,
      conversationsLocked: results.filter((r) => r.conversationLocked).length,
    }
  },
})

/**
 * INTERNAL: Déverrouille une conversation après renouvellement d'abonnement messagerie
 */
export const unlockConversationAfterRenewal = internalMutation({
  args: {
    subscriberId: v.id("users"),
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Trouver la conversation
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("creatorId", args.creatorId).eq("userId", args.subscriberId),
      )
      .first()

    if (!conversation) {
      return { success: false, reason: "conversation_not_found" }
    }

    if (!conversation.isLocked) {
      return { success: true, reason: "already_unlocked" }
    }

    // Déverrouiller la conversation
    await ctx.db.patch(conversation._id, {
      isLocked: false,
      lockedAt: undefined,
      lockedReason: undefined,
    })

    // Insérer un message système
    await ctx.db.insert("messages", {
      conversationId: conversation._id,
      senderId: args.subscriberId,
      messageType: "system",
      systemMessageType: "subscription_renewed",
    })

    return { success: true }
  },
})
