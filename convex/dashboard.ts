import { v } from "convex/values"
import { query } from "./_generated/server"
import { requireCreator } from "./lib/auth"
import {
  SUBSCRIPTION_CREATOR_RATE,
  TIP_CREATOR_RATE,
  USD_TO_XAF_RATE,
} from "./lib/constants"
import { postMediaValidator } from "./lib/validators"

// ============================================================================
// Helpers
// ============================================================================

const normalizeToXAF = (amount: number, currency: string): number => {
  if (currency.toUpperCase() === "USD") {
    return amount * USD_TO_XAF_RATE
  }
  return amount
}

const getMonthKey = (timestamp: number): string => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Vue d'ensemble du dashboard créateur.
 * Agrège KPIs + activité récente en une seule query.
 */
export const getDashboardOverview = query({
  args: {},
  returns: v.object({
    totalRevenueNet: v.number(),
    activeSubscribers: v.number(),
    totalPosts: v.number(),
    totalLikes: v.number(),
    tipCount: v.number(),
    currency: v.string(),
    recentActivity: v.array(
      v.object({
        type: v.union(
          v.literal("new_subscriber"),
          v.literal("tip_received"),
        ),
        timestamp: v.number(),
        actorName: v.string(),
        actorImage: v.string(),
        amount: v.optional(v.number()),
      }),
    ),
  }),
  handler: async (ctx) => {
    const currentUser = await requireCreator(ctx)

    // Parallel fetch of all data sources
    const [allTransactions, allTips, activeSubscriptions, userStats] =
      await Promise.all([
        ctx.db
          .query("transactions")
          .withIndex("by_creator", (q) => q.eq("creatorId", currentUser._id))
          .filter((q) => q.eq(q.field("status"), "succeeded"))
          .take(5000),
        ctx.db
          .query("tips")
          .withIndex("by_creator_status", (q) =>
            q.eq("creatorId", currentUser._id).eq("status", "succeeded"),
          )
          .take(5000),
        ctx.db
          .query("subscriptions")
          .withIndex("by_creator", (q) => q.eq("creator", currentUser._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("status"), "active"),
              q.eq(q.field("type"), "content_access"),
            ),
          )
          .take(5000),
        ctx.db
          .query("userStats")
          .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
          .unique(),
      ])

    // Revenue calculation
    const subsGross = allTransactions.reduce(
      (sum, tx) => sum + normalizeToXAF(tx.amount, tx.currency),
      0,
    )
    const tipsGross = allTips.reduce(
      (sum, tip) => sum + normalizeToXAF(tip.amount, tip.currency),
      0,
    )
    const totalRevenueNet = Math.round(
      subsGross * SUBSCRIPTION_CREATOR_RATE +
        tipsGross * TIP_CREATOR_RATE,
    )

    // Recent activity: last 5 subscriptions + last 5 tips
    const recentSubs = activeSubscriptions
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5)
    const recentTips = allTips
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5)

    // Batch fetch actors
    const actorIds = [
      ...new Set([
        ...recentSubs.map((s) => s.subscriber),
        ...recentTips.map((t) => t.senderId),
      ]),
    ]
    const actors = await Promise.all(actorIds.map((id) => ctx.db.get(id)))
    const actorMap = new Map(
      actorIds.map((id, i) => [id, actors[i]]),
    )

    // Build activity feed
    const recentActivity = [
      ...recentSubs.map((s) => {
        const actor = actorMap.get(s.subscriber)
        return {
          type: "new_subscriber" as const,
          timestamp: s._creationTime,
          actorName: actor?.name ?? "Utilisateur",
          actorImage: actor?.image ?? "",
        }
      }),
      ...recentTips.map((t) => {
        const actor = actorMap.get(t.senderId)
        return {
          type: "tip_received" as const,
          timestamp: t._creationTime,
          actorName: actor?.name ?? "Utilisateur",
          actorImage: actor?.image ?? "",
          amount: Math.round(normalizeToXAF(t.amount, t.currency)),
        }
      }),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    return {
      totalRevenueNet,
      activeSubscribers: activeSubscriptions.length,
      totalPosts: userStats?.postsCount ?? 0,
      totalLikes: userStats?.totalLikes ?? 0,
      tipCount: allTips.length,
      currency: "XAF",
      recentActivity,
    }
  },
})

/**
 * Tendances de revenus par mois (abonnements vs pourboires).
 */
export const getRevenueTrends = query({
  args: {
    months: v.optional(v.number()),
  },
  returns: v.object({
    trends: v.array(
      v.object({
        month: v.string(),
        subscriptionRevenue: v.number(),
        tipRevenue: v.number(),
        total: v.number(),
      }),
    ),
    currency: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUser = await requireCreator(ctx)
    const monthsToShow = args.months ?? 6

    const now = new Date()
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - monthsToShow + 1,
      1,
    )
    const startTimestamp = startDate.getTime()

    const [allTransactions, allTips] = await Promise.all([
      ctx.db
        .query("transactions")
        .withIndex("by_creator", (q) => q.eq("creatorId", currentUser._id))
        .filter((q) => q.eq(q.field("status"), "succeeded"))
        .take(5000),
      ctx.db
        .query("tips")
        .withIndex("by_creator_status", (q) =>
          q.eq("creatorId", currentUser._id).eq("status", "succeeded"),
        )
        .take(5000),
    ])

    // Group by month
    const monthlyData = new Map<
      string,
      { subs: number; tips: number }
    >()

    for (const tx of allTransactions) {
      if (tx._creationTime < startTimestamp) continue
      const key = getMonthKey(tx._creationTime)
      const existing = monthlyData.get(key) ?? { subs: 0, tips: 0 }
      existing.subs +=
        normalizeToXAF(tx.amount, tx.currency) * SUBSCRIPTION_CREATOR_RATE
      monthlyData.set(key, existing)
    }

    for (const tip of allTips) {
      if (tip._creationTime < startTimestamp) continue
      const key = getMonthKey(tip._creationTime)
      const existing = monthlyData.get(key) ?? { subs: 0, tips: 0 }
      existing.tips +=
        normalizeToXAF(tip.amount, tip.currency) * TIP_CREATOR_RATE
      monthlyData.set(key, existing)
    }

    // Generate all months in range (fill missing with 0)
    const trends = []
    for (let i = 0; i < monthsToShow; i++) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (monthsToShow - 1 - i),
        1,
      )
      const key = getMonthKey(date.getTime())
      const data = monthlyData.get(key) ?? { subs: 0, tips: 0 }

      trends.push({
        month: key,
        subscriptionRevenue: Math.round(data.subs),
        tipRevenue: Math.round(data.tips),
        total: Math.round(data.subs + data.tips),
      })
    }

    return { trends, currency: "XAF" }
  },
})

/**
 * Croissance des abonnés par mois.
 */
export const getSubscriberGrowth = query({
  args: {
    months: v.optional(v.number()),
  },
  returns: v.object({
    growth: v.array(
      v.object({
        month: v.string(),
        newSubscribers: v.number(),
        activeSubscribers: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const currentUser = await requireCreator(ctx)
    const monthsToShow = args.months ?? 6

    const now = new Date()

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator", (q) => q.eq("creator", currentUser._id))
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .take(5000)

    const growth = []
    for (let i = 0; i < monthsToShow; i++) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (monthsToShow - 1 - i),
        1,
      )
      const monthKey = getMonthKey(date.getTime())
      const monthStart = date.getTime()
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ).getTime()

      let newCount = 0
      let activeCount = 0

      for (const sub of subscriptions) {
        // New: created during this month
        if (
          sub._creationTime >= monthStart &&
          sub._creationTime <= monthEnd
        ) {
          newCount++
        }
        // Active: had an active period overlapping with month end
        if (sub.startDate <= monthEnd && sub.endDate > monthEnd) {
          activeCount++
        }
      }

      growth.push({
        month: monthKey,
        newSubscribers: newCount,
        activeSubscribers: activeCount,
      })
    }

    return { growth }
  },
})

/**
 * Top posts triés par score d'engagement (likes + comments*2).
 */
export const getTopPosts = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    posts: v.array(
      v.object({
        _id: v.id("posts"),
        _creationTime: v.number(),
        content: v.string(),
        medias: v.array(postMediaValidator),
        visibility: v.union(
          v.literal("public"),
          v.literal("subscribers_only"),
        ),
        likeCount: v.number(),
        commentCount: v.number(),
        engagementScore: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const currentUser = await requireCreator(ctx)
    const limit = args.limit ?? 10

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", currentUser._id))
      .take(200)

    // Batch fetch engagement counts
    const enriched = await Promise.all(
      posts.map(async (post) => {
        const [likes, comments] = await Promise.all([
          ctx.db
            .query("likes")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .take(10000),
          ctx.db
            .query("comments")
            .withIndex("by_post", (q) => q.eq("post", post._id))
            .take(5000),
        ])

        const likeCount = likes.length
        const commentCount = comments.length

        return {
          _id: post._id,
          _creationTime: post._creationTime,
          content: post.content,
          medias: post.medias,
          visibility: post.visibility,
          likeCount,
          commentCount,
          engagementScore: likeCount + commentCount * 2,
        }
      }),
    )

    // Sort by engagement and take top N
    const sorted = enriched
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit)

    return { posts: sorted }
  },
})

/**
 * Statistiques d'engagement du contenu.
 * Moyenne likes/comments par post + comparaison public vs abonnés.
 */
export const getEngagementStats = query({
  args: {},
  returns: v.object({
    avgLikesPerPost: v.number(),
    avgCommentsPerPost: v.number(),
    publicPerformance: v.object({
      count: v.number(),
      avgEngagement: v.number(),
    }),
    subscribersOnlyPerformance: v.object({
      count: v.number(),
      avgEngagement: v.number(),
    }),
    totalEngagements: v.number(),
  }),
  handler: async (ctx) => {
    const currentUser = await requireCreator(ctx)

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", currentUser._id))
      .take(200)

    if (posts.length === 0) {
      return {
        avgLikesPerPost: 0,
        avgCommentsPerPost: 0,
        publicPerformance: { count: 0, avgEngagement: 0 },
        subscribersOnlyPerformance: { count: 0, avgEngagement: 0 },
        totalEngagements: 0,
      }
    }

    // Batch fetch engagement per post
    const enriched = await Promise.all(
      posts.map(async (post) => {
        const [likes, comments] = await Promise.all([
          ctx.db
            .query("likes")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .take(10000),
          ctx.db
            .query("comments")
            .withIndex("by_post", (q) => q.eq("post", post._id))
            .take(5000),
        ])

        return {
          visibility: post.visibility,
          likeCount: likes.length,
          commentCount: comments.length,
          total: likes.length + comments.length,
        }
      }),
    )

    const totalLikes = enriched.reduce((sum, p) => sum + p.likeCount, 0)
    const totalComments = enriched.reduce(
      (sum, p) => sum + p.commentCount,
      0,
    )
    const totalEngagements = totalLikes + totalComments

    const publicPosts = enriched.filter((p) => p.visibility === "public")
    const subscriberPosts = enriched.filter(
      (p) => p.visibility === "subscribers_only",
    )

    const avgOf = (arr: typeof enriched) =>
      arr.length > 0
        ? Math.round(arr.reduce((s, p) => s + p.total, 0) / arr.length)
        : 0

    return {
      avgLikesPerPost: Math.round(totalLikes / posts.length),
      avgCommentsPerPost: Math.round(totalComments / posts.length),
      publicPerformance: {
        count: publicPosts.length,
        avgEngagement: avgOf(publicPosts),
      },
      subscribersOnlyPerformance: {
        count: subscriberPosts.length,
        avgEngagement: avgOf(subscriberPosts),
      },
      totalEngagements,
    }
  },
})
