import { UserJSON } from "@clerk/backend"
import { ConvexError, Validator, v } from "convex/values"
import {
  QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server"

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique()
}

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // Vient de Clerk
  async handler(ctx, { data }) {
    const userAttributes = {
      externalId: data.id,
      tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${data.id}`,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses[0]?.email_address,
      image: data.image_url,
      accountType: "USER" as const,
      isOnline: true,
    }

    const user = await userByExternalId(ctx, data.id)
    if (user === null) {
      await ctx.db.insert("users", userAttributes)
    } else {
      await ctx.db.patch(user._id, userAttributes)
    }
  },
})

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId)

    if (user !== null) {
      await ctx.db.delete(user._id)
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      )
    }
  },
})

export const createUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.string(),
    externalId: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {
      externalId: args.externalId,
      tokenIdentifier: args.tokenIdentifier,
      name: args.name,
      email: args.email,
      image: args.image,
      lastSeenAt: Date.now(),
      isOnline: true,
      imageBanner: "https://cdn.fantribe.io/fantribe/placeholder.jpg",
      accountType: "USER",
    })
  },
})

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    return user
  },
})

// A modifier
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const users = await ctx.db.query("users").collect()

    // return all users without the current user
    return users.filter(
      (user) => user.tokenIdentifier !== identity.tokenIdentifier,
    )
  },
})

// Fisher-Yates shuffle algorithm for unbiased randomization
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const getSuggestedCreators = query({
  // Le refreshKey permet de forcer une nouvelle randomisation
  args: { refreshKey: v.optional(v.number()) },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    // Limit fetch to 200 creators max to avoid loading thousands
    // Still provides good randomization diversity for 48 results
    const creators = await ctx.db
      .query("users")
      .withIndex("by_accountType", (q) => q.eq("accountType", "CREATOR"))
      .take(200)

    // Mélanger avec Fisher-Yates (distribution uniforme) et prendre les 48 premiers
    const shuffled = fisherYatesShuffle(creators)
    return shuffled.slice(0, 48)
  },
})

// Session management for presence (called by Clerk webhooks)
export const incrementUserSession = internalMutation({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId)
    if (!user) {
      console.warn(`User not found for externalId: ${args.externalId}`)
      return
    }

    const currentSessions = user.activeSessions ?? 0
    await ctx.db.patch(user._id, {
      activeSessions: currentSessions + 1,
      isOnline: true,
      lastSeenAt: Date.now(),
    })
  },
})

export const decrementUserSession = internalMutation({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId)
    if (!user) {
      console.warn(`User not found for externalId: ${args.externalId}`)
      return
    }

    const currentSessions = user.activeSessions ?? 1
    const newSessionCount = Math.max(0, currentSessions - 1)

    await ctx.db.patch(user._id, {
      activeSessions: newSessionCount,
      isOnline: newSessionCount > 0,
      lastSeenAt: Date.now(),
    })
  },
})

// Heartbeat mutation for client-side presence updates (2 min interval)
export const updatePresenceHeartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) return null

    await ctx.db.patch(user._id, {
      isOnline: true,
      lastSeenAt: Date.now(),
    })

    return { success: true }
  },
})

// Mark user as offline (called on page unload or visibility hidden)
export const setUserOffline = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) return null

    // Only set offline if no active sessions from webhooks
    const activeSessions = user.activeSessions ?? 0
    if (activeSessions === 0) {
      await ctx.db.patch(user._id, {
        isOnline: false,
        lastSeenAt: Date.now(),
      })
    } else {
      // Just update lastSeenAt if there are still active sessions
      await ctx.db.patch(user._id, {
        lastSeenAt: Date.now(),
      })
    }

    return { success: true }
  },
})

// Internal mutation for cron job to mark stale users offline
export const markStaleUsersOffline = internalMutation({
  args: {},
  handler: async (ctx) => {
    const TWO_MINUTES_AGO = Date.now() - 2 * 60 * 1000

    // Get all users who are online but haven't been seen in 2+ minutes
    const onlineUsers = await ctx.db
      .query("users")
      .withIndex("by_isOnline", (q) => q.eq("isOnline", true))
      .collect()

    // Filter stale users and batch update
    const staleUsers = onlineUsers.filter(
      (user) => (user.lastSeenAt ?? 0) < TWO_MINUTES_AGO
    )

    await Promise.all(
      staleUsers.map((user) =>
        ctx.db.patch(user._id, {
          isOnline: false,
          activeSessions: 0,
        })
      )
    )

    const markedOfflineCount = staleUsers.length

    if (markedOfflineCount > 0) {
      console.log(`Marked ${markedOfflineCount} stale users as offline`)
    }

    return { markedOfflineCount }
  },
})

export const getUserProfile = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique()

    return user
  },
})

export const updateUserProfile = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    bio: v.string(),
    location: v.string(),
    socials: v.array(v.string()),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      throw new ConvexError("User not found")
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      username: args.username,
      bio: args.bio,
      location: args.location,
      socials: args.socials,
    })
  },
})

export const updateProfileImage = mutation({
  args: {
    imgUrl: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      throw new ConvexError("User not found")
    }

    await ctx.db.patch(user._id, {
      image: args.imgUrl,
    })
  },
})

export const updateBannerImage = mutation({
  args: {
    bannerUrl: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      throw new ConvexError("User not found")
    }

    await ctx.db.patch(user._id, {
      imageBanner: args.bannerUrl,
    })
  },
})

export const getAvailableUsername = query({
  args: {
    username: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.neq(q.field("tokenIdentifier"), args.tokenIdentifier))
      .unique()

    return !existingUsername
  },
})

export const searchUsers = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser) return []

    const searchTermLower = args.searchTerm.toLowerCase().trim()
    if (!searchTermLower) return []

    // Utiliser le search index pour la recherche par nom (full-text search)
    const nameResults = await ctx.db
      .query("users")
      .withSearchIndex("search_users", (q) => q.search("name", searchTermLower))
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), currentUser._id),
          q.neq(q.field("username"), undefined),
        ),
      )
      .take(10)

    // Recherche par username (substring match - nécessite un filtre en mémoire)
    const usersWithUsername = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), currentUser._id),
          q.neq(q.field("username"), undefined),
        ),
      )
      .collect()

    // Filtrer par username avec early termination
    const usernameResults: typeof usersWithUsername = []
    const seenIds = new Set(nameResults.map((u) => u._id))

    for (const user of usersWithUsername) {
      if (
        !seenIds.has(user._id) &&
        user.username?.toLowerCase().includes(searchTermLower)
      ) {
        usernameResults.push(user)
        seenIds.add(user._id)
        if (usernameResults.length >= 10) break
      }
    }

    // Combiner les résultats (name results prioritaires)
    const combined = [...nameResults, ...usernameResults]
    return combined.slice(0, 10)
  },
})

// Toggle pinned post (max 3 pinned posts)
export const togglePinnedPost = mutation({
  args: {
    postId: v.id("posts"),
    replaceOldest: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    const post = await ctx.db.get(args.postId)
    if (!post || post.author !== user._id) {
      throw new ConvexError("Post not found or unauthorized")
    }

    const pinnedPosts = user.pinnedPostIds || []
    const isPinned = pinnedPosts.includes(args.postId)

    if (isPinned) {
      // Unpin
      await ctx.db.patch(user._id, {
        pinnedPostIds: pinnedPosts.filter((id) => id !== args.postId),
      })
      return { pinned: false }
    } else {
      // Pin (max 3)
      if (pinnedPosts.length >= 3) {
        if (args.replaceOldest) {
          // Remove oldest (first) and add new post
          const newPinnedPosts = [...pinnedPosts.slice(1), args.postId]
          await ctx.db.patch(user._id, { pinnedPostIds: newPinnedPosts })
          return { pinned: true, replaced: pinnedPosts[0] }
        }
        // Return maxReached flag instead of throwing error
        return { pinned: false, maxReached: true }
      }
      await ctx.db.patch(user._id, {
        pinnedPostIds: [...pinnedPosts, args.postId],
      })
      return { pinned: true }
    }
  },
})

// Get pinned posts for a user
export const getPinnedPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user || !user.pinnedPostIds?.length) return []

    const posts = await Promise.all(
      user.pinnedPostIds.map((id) => ctx.db.get(id))
    )

    // Filter out deleted posts and enrich with author data
    return posts
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .map((post) => ({
        ...post,
        author: user,
      }))
  },
})

// Update social links with platform metadata
export const updateSocialLinks = mutation({
  args: {
    socialLinks: v.array(
      v.object({
        platform: v.union(
          v.literal("twitter"),
          v.literal("instagram"),
          v.literal("tiktok"),
          v.literal("youtube"),
          v.literal("website"),
          v.literal("other")
        ),
        url: v.string(),
        username: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    await ctx.db.patch(user._id, { socialLinks: args.socialLinks })
  },
})

// Add badge to user (SUPERUSER only)
export const addBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeType: v.union(
      v.literal("verified"),
      v.literal("top_creator"),
      v.literal("founding_member"),
      v.literal("popular"),
      v.literal("rising_star")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new ConvexError("Unauthorized - SUPERUSER required")
    }

    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) throw new ConvexError("User not found")

    const existingBadges = targetUser.badges || []
    const hasBadge = existingBadges.some((b) => b.type === args.badgeType)

    if (!hasBadge) {
      await ctx.db.patch(args.userId, {
        badges: [
          ...existingBadges,
          { type: args.badgeType, awardedAt: Date.now() },
        ],
      })
    }

    return { success: true }
  },
})

// Remove badge from user (SUPERUSER only)
export const removeBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeType: v.union(
      v.literal("verified"),
      v.literal("top_creator"),
      v.literal("founding_member"),
      v.literal("popular"),
      v.literal("rising_star")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new ConvexError("Unauthorized - SUPERUSER required")
    }

    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) throw new ConvexError("User not found")

    const existingBadges = targetUser.badges || []

    await ctx.db.patch(args.userId, {
      badges: existingBadges.filter((b) => b.type !== args.badgeType),
    })

    return { success: true }
  },
})

// Update adult content preference
export const updateAdultContentPreference = mutation({
  args: {
    allowAdultContent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    await ctx.db.patch(user._id, {
      allowAdultContent: args.allowAdultContent,
    })

    return { success: true }
  },
})
