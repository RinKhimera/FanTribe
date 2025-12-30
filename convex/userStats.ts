import { ConvexError, v } from "convex/values"
import { internalMutation, query } from "./_generated/server"

// Get user stats (public)
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Try to get cached stats first
    const cachedStats = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique()

    if (cachedStats) {
      // Check if stats are fresh (less than 5 minutes old)
      const FIVE_MINUTES = 5 * 60 * 1000
      if (Date.now() - cachedStats.lastUpdated < FIVE_MINUTES) {
        return {
          postsCount: cachedStats.postsCount,
          subscribersCount: cachedStats.subscribersCount,
          totalLikes: cachedStats.totalLikes,
        }
      }
    }

    // Compute stats on the fly
    const user = await ctx.db.get(args.userId)
    if (!user) throw new ConvexError("User not found")

    // Count posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", args.userId))
      .collect()
    const postsCount = posts.length

    // Count active subscribers
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator", (q) => q.eq("creator", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    const subscribersCount = subscriptions.length

    // Count total likes on user's posts
    let totalLikes = 0
    for (const post of posts) {
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      totalLikes += likes.length
    }

    return {
      postsCount,
      subscribersCount,
      totalLikes,
    }
  },
})

// Internal mutation to update/create user stats (called by triggers or cron)
export const updateUserStats = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) return

    // Count posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", args.userId))
      .collect()
    const postsCount = posts.length

    // Count active subscribers
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator", (q) => q.eq("creator", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    const subscribersCount = subscriptions.length

    // Count total likes
    let totalLikes = 0
    for (const post of posts) {
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      totalLikes += likes.length
    }

    // Check if stats entry exists
    const existingStats = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique()

    if (existingStats) {
      await ctx.db.patch(existingStats._id, {
        postsCount,
        subscribersCount,
        totalLikes,
        lastUpdated: Date.now(),
      })
    } else {
      await ctx.db.insert("userStats", {
        userId: args.userId,
        postsCount,
        subscribersCount,
        totalLikes,
        lastUpdated: Date.now(),
      })
    }
  },
})

// Batch update stats for all creators (cron job)
export const updateAllCreatorStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const creators = await ctx.db
      .query("users")
      .withIndex("by_accountType", (q) => q.eq("accountType", "CREATOR"))
      .collect()

    for (const creator of creators) {
      // Count posts
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("author", creator._id))
        .collect()
      const postsCount = posts.length

      // Count active subscribers
      const subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_creator", (q) => q.eq("creator", creator._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect()
      const subscribersCount = subscriptions.length

      // Count total likes
      let totalLikes = 0
      for (const post of posts) {
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect()
        totalLikes += likes.length
      }

      // Upsert stats
      const existingStats = await ctx.db
        .query("userStats")
        .withIndex("by_userId", (q) => q.eq("userId", creator._id))
        .unique()

      if (existingStats) {
        await ctx.db.patch(existingStats._id, {
          postsCount,
          subscribersCount,
          totalLikes,
          lastUpdated: Date.now(),
        })
      } else {
        await ctx.db.insert("userStats", {
          userId: creator._id,
          postsCount,
          subscribersCount,
          totalLikes,
          lastUpdated: Date.now(),
        })
      }
    }

    return { updatedCount: creators.length }
  },
})
