import { UserJSON } from "@clerk/backend"
import { ConvexError, Validator, v } from "convex/values"
import { api, internal } from "./_generated/api"
import {
  QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server"
import { getAuthenticatedUser, requireSuperuser } from "./lib/auth"
import { hasActiveSubscription } from "./lib/subscriptions"
import {
  badgeValidator,
  banDetailsValidator,
  banHistoryEntryValidator,
  personalInfoValidator,
  postMediaValidator,
  socialLinkValidator,
  userDocValidator,
} from "./lib/validators"

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
    .unique()
}

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // Vient de Clerk
  returns: v.null(),
  async handler(ctx, { data }) {
    const userAttributes = {
      externalId: data.id,
      tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${data.id}`,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses[0]?.email_address,
      image: data.image_url,
      isOnline: true,
    }

    const user = await userByExternalId(ctx, data.id)
    if (user === null) {
      await ctx.db.insert("users", {
        ...userAttributes,
        accountType: "USER",
      })
    } else {
      // Don't overwrite accountType — it may have been promoted to CREATOR/SUPERUSER
      await ctx.db.patch(user._id, userAttributes)
    }
    return null
  },
})

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  returns: v.null(),
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId)
    if (user === null) {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      )
      return null
    }

    const userId = user._id

    // ── Phase 1 fetch: all directly-indexed records in one parallel shot ───
    const [
      posts,
      comments,
      likes,
      bookmarks,
      notificationsAsRecipient,
      blocksAsBlocker,
      blocksAsBlocked,
      conversationsAsCreator,
      conversationsAsUser,
      subscriptionsAsSubscriber,
      subscriptionsAsCreator,
      transactionsAsSubscriber,
      transactionsAsCreator,
      tipsAsSender,
      tipsAsCreator,
      reportsAsReporter,
      reportsAsReported,
      userStats,
      assetsDraft,
      validationDocs,
      creatorApplications,
    ] = await Promise.all([
      ctx.db.query("posts").withIndex("by_author", (q) => q.eq("author", userId)).collect(),
      ctx.db.query("comments").withIndex("by_author", (q) => q.eq("author", userId)).collect(),
      ctx.db.query("likes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("bookmarks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("notifications").withIndex("by_recipient", (q) => q.eq("recipientId", userId)).take(10000),
      ctx.db.query("blocks").withIndex("by_blocker", (q) => q.eq("blockerId", userId)).collect(),
      ctx.db.query("blocks").withIndex("by_blocked", (q) => q.eq("blockedId", userId)).collect(),
      ctx.db.query("conversations").withIndex("by_creatorId", (q) => q.eq("creatorId", userId)).collect(),
      ctx.db.query("conversations").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("subscriptions").withIndex("by_subscriber", (q) => q.eq("subscriber", userId)).collect(),
      ctx.db.query("subscriptions").withIndex("by_creator", (q) => q.eq("creator", userId)).collect(),
      ctx.db.query("transactions").withIndex("by_subscriber", (q) => q.eq("subscriberId", userId)).collect(),
      ctx.db.query("transactions").withIndex("by_creator", (q) => q.eq("creatorId", userId)).collect(),
      ctx.db.query("tips").withIndex("by_sender", (q) => q.eq("senderId", userId)).collect(),
      ctx.db.query("tips").withIndex("by_creator", (q) => q.eq("creatorId", userId)).collect(),
      ctx.db.query("reports").withIndex("by_reporter", (q) => q.eq("reporterId", userId)).collect(),
      ctx.db.query("reports").withIndex("by_reported_user", (q) => q.eq("reportedUserId", userId)).collect(),
      ctx.db.query("userStats").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("assetsDraft").withIndex("by_author", (q) => q.eq("author", userId)).collect(),
      ctx.db.query("validationDocumentsDraft").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("creatorApplications").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
    ])

    // Collect media URLs before any deletion
    const mediaUrls: string[] = [
      user.image,
      ...(user.imageBanner ? [user.imageBanner] : []),
      ...posts.flatMap((p) => p.medias.map((m) => m.url)),
      ...assetsDraft.map((a) => a.mediaUrl),
      ...validationDocs.map((d) => d.mediaUrl),
      ...creatorApplications.flatMap((app) => app.identityDocuments.map((d) => d.url)),
    ]

    // Stash IDs for Phase 2 cascade queries
    const postIds = posts.map((p) => p._id)
    const allConversationIds = [
      ...conversationsAsCreator.map((c) => c._id),
      ...conversationsAsUser.map((c) => c._id),
    ]

    // Deduplicate reports: same doc can appear in both arrays if user self-reported
    const uniqueReportIds = new Set([
      ...reportsAsReporter.map((r) => r._id),
      ...reportsAsReported.map((r) => r._id),
    ])

    // ── Phase 1 delete: all indexed records + posts + conversations ─────────
    await Promise.all([
      ...comments.map((r) => ctx.db.delete(r._id)),
      ...likes.map((r) => ctx.db.delete(r._id)),
      ...bookmarks.map((r) => ctx.db.delete(r._id)),
      ...notificationsAsRecipient.map((r) => ctx.db.delete(r._id)),
      ...blocksAsBlocker.map((r) => ctx.db.delete(r._id)),
      ...blocksAsBlocked.map((r) => ctx.db.delete(r._id)),
      ...conversationsAsCreator.map((r) => ctx.db.delete(r._id)),
      ...conversationsAsUser.map((r) => ctx.db.delete(r._id)),
      ...subscriptionsAsSubscriber.map((r) => ctx.db.delete(r._id)),
      ...subscriptionsAsCreator.map((r) => ctx.db.delete(r._id)),
      ...transactionsAsSubscriber.map((r) => ctx.db.delete(r._id)),
      ...transactionsAsCreator.map((r) => ctx.db.delete(r._id)),
      ...tipsAsSender.map((r) => ctx.db.delete(r._id)),
      ...tipsAsCreator.map((r) => ctx.db.delete(r._id)),
      ...[...uniqueReportIds].map((id) => ctx.db.delete(id)),
      ...userStats.map((r) => ctx.db.delete(r._id)),
      ...assetsDraft.map((r) => ctx.db.delete(r._id)),
      ...validationDocs.map((r) => ctx.db.delete(r._id)),
      ...creatorApplications.map((r) => ctx.db.delete(r._id)),
      ...posts.map((r) => ctx.db.delete(r._id)),
    ])

    // ── Phase 2 fetch: cascade + full scans ────────────────────────────────
    // Reads in this phase see Phase 1 deletions: user's own comments/likes/bookmarks
    // are already gone, so by_post queries return only other users' interactions.
    // Promise.all(emptyArray.map(...)) = Promise<[]> — no ternary needed.
    const [postCascade, messages, allNotifs, pendingNotifs] = await Promise.all([
      Promise.all(
        postIds.map((postId) =>
          Promise.all([
            ctx.db.query("comments").withIndex("by_post", (q) => q.eq("post", postId)).collect(),
            ctx.db.query("likes").withIndex("by_post", (q) => q.eq("postId", postId)).collect(),
            ctx.db.query("bookmarks").withIndex("by_post", (q) => q.eq("postId", postId)).collect(),
            ctx.db.query("notifications").withIndex("by_post", (q) => q.eq("postId", postId)).collect(),
          ]),
        ),
      ),
      Promise.all(
        allConversationIds.map((convId) =>
          ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", convId)).collect(),
        ),
      ).then((r) => r.flat()),
      // Full scan for notifications where user appears as actor.
      // Recipient notifications were deleted in Phase 1 and are invisible here.
      ctx.db.query("notifications").collect(),
      // Filter scan for pending notifications triggered by this user.
      ctx.db.query("pendingNotifications").filter((q) => q.eq(q.field("actorId"), userId)).collect(),
    ])

    // Collect message media URLs
    for (const msg of messages) {
      if (msg.medias) {
        mediaUrls.push(...msg.medias.map((m) => m.url))
      }
    }

    // Exclude by_post notifications from actor scan to avoid double-delete
    const postNotifIds = new Set(
      postCascade.flatMap(([, , , notifs]) => notifs.map((n) => n._id as string)),
    )
    const actorNotifications = allNotifs.filter(
      (n) => n.actorIds.includes(userId) && !postNotifIds.has(n._id as string),
    )

    // ── Schedule Bunny CDN cleanup (fire-and-forget) ────────────────────────
    if (mediaUrls.length > 0) {
      await ctx.scheduler.runAfter(0, internal.internalActions.deleteMultipleBunnyAssets, {
        mediaUrls,
      })
    }

    // ── Phase 2 delete ─────────────────────────────────────────────────────
    await Promise.all([
      ...postCascade.flatMap(([c, l, b, n]) =>
        [...c, ...l, ...b, ...n].map((r) => ctx.db.delete(r._id)),
      ),
      ...messages.map((r) => ctx.db.delete(r._id)),
      ...pendingNotifs.map((r) => ctx.db.delete(r._id)),
      ...actorNotifications.map((n) => {
        const filtered = n.actorIds.filter((id) => id !== userId)
        return filtered.length === 0
          ? ctx.db.delete(n._id)
          : ctx.db.patch(n._id, { actorIds: filtered, actorCount: filtered.length })
      }),
    ])

    // Delete user document last
    await ctx.db.delete(userId)
    return null
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
  returns: v.null(),
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
    return null
  },
})

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      username: v.optional(v.string()),
      email: v.string(),
      image: v.string(),
      imageBanner: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      socialLinks: v.optional(v.array(socialLinkValidator)),
      pinnedPostIds: v.optional(v.array(v.id("posts"))),
      isOnline: v.boolean(),
      activeSessions: v.optional(v.number()),
      lastSeenAt: v.optional(v.number()),
      tokenIdentifier: v.string(),
      externalId: v.optional(v.string()),
      accountType: v.union(
        v.literal("USER"),
        v.literal("CREATOR"),
        v.literal("SUPERUSER"),
      ),
      allowAdultContent: v.optional(v.boolean()),
      personalInfo: v.optional(personalInfoValidator),
      notificationPreferences: v.optional(
        v.object({
          likes: v.optional(v.boolean()),
          comments: v.optional(v.boolean()),
          newPosts: v.optional(v.boolean()),
          subscriptions: v.optional(v.boolean()),
          messages: v.optional(v.boolean()),
          tips: v.optional(v.boolean()),
          emailNotifications: v.optional(v.boolean()),
        }),
      ),
      privacySettings: v.optional(
        v.object({
          profileVisibility: v.optional(
            v.union(v.literal("public"), v.literal("private"))
          ),
          allowMessagesFromNonSubscribers: v.optional(v.boolean()),
          language: v.optional(v.string()),
        }),
      ),
      isBanned: v.optional(v.boolean()),
      banDetails: v.optional(banDetailsValidator),
      banHistory: v.optional(v.array(banHistoryEntryValidator)),
      badges: v.optional(v.array(badgeValidator)),
      onboardingCompleted: v.optional(v.boolean()),
      banExpired: v.optional(v.boolean()),
      activeBan: v.optional(
        v.object({
          type: v.optional(
            v.union(v.literal("temporary"), v.literal("permanent")),
          ),
          reason: v.optional(v.string()),
          bannedAt: v.optional(v.number()),
          expiresAt: v.optional(v.number()),
        }),
      ),
    }),
    v.null(),
  ),
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

    // Check if user is banned
    if (user.isBanned) {
      // Check if temporary ban has expired
      if (
        user.banDetails?.type === "temporary" &&
        user.banDetails?.expiresAt &&
        Date.now() > user.banDetails.expiresAt
      ) {
        // Ban has expired - return user with expiredBan flag
        // The actual unban will be handled by a scheduled function or on next write
        return {
          ...user,
          isBanned: false,
          banExpired: true,
        }
      }

      // Active ban - return user with ban info for frontend handling
      return {
        ...user,
        activeBan: {
          type: user.banDetails?.type,
          reason: user.banDetails?.reason,
          bannedAt: user.banDetails?.bannedAt,
          expiresAt: user.banDetails?.expiresAt,
        },
      }
    }

    return user
  },
})

// A modifier
export const getUsers = query({
  args: {},
  returns: v.array(userDocValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Not authenticated")
    }

    const users = await ctx.db.query("users").take(1000)

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
  returns: v.array(userDocValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    // Limit fetch to 200 creators max to avoid loading thousands
    // Still provides good randomization diversity for 48 results
    const creators = await ctx.db
      .query("users")
      .withIndex("by_accountType", (q) => q.eq("accountType", "CREATOR"))
      .take(200)

    // Exclude current user from suggestions
    const filtered = creators.filter(
      (c) => c.externalId !== identity.subject,
    )

    // Mélanger avec Fisher-Yates (distribution uniforme) et prendre les 48 premiers
    const shuffled = fisherYatesShuffle(filtered)
    return shuffled.slice(0, 48)
  },
})

// Session management for presence (called by Clerk webhooks)
export const incrementUserSession = internalMutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId)
    if (!user) {
      console.warn(`User not found for externalId: ${args.externalId}`)
      return null
    }

    const currentSessions = user.activeSessions ?? 0
    await ctx.db.patch(user._id, {
      activeSessions: currentSessions + 1,
      isOnline: true,
      lastSeenAt: Date.now(),
    })
    return null
  },
})

export const decrementUserSession = internalMutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId)
    if (!user) {
      console.warn(`User not found for externalId: ${args.externalId}`)
      return null
    }

    const currentSessions = user.activeSessions ?? 1
    const newSessionCount = Math.max(0, currentSessions - 1)

    await ctx.db.patch(user._id, {
      activeSessions: newSessionCount,
      isOnline: newSessionCount > 0,
      lastSeenAt: Date.now(),
    })
    return null
  },
})

// Heartbeat mutation for client-side presence updates (2 min interval)
export const updatePresenceHeartbeat = mutation({
  args: {},
  returns: v.union(v.object({ success: v.boolean() }), v.null()),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx, { optional: true })
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
  returns: v.union(v.object({ success: v.boolean() }), v.null()),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx, { optional: true })
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
  returns: v.object({ markedOfflineCount: v.number() }),
  handler: async (ctx) => {
    const TWO_MINUTES_AGO = Date.now() - 2 * 60 * 1000

    // Utilise index composé pour filtrer directement au niveau DB
    const staleUsers = await ctx.db
      .query("users")
      .withIndex("by_isOnline_lastSeenAt", (q) =>
        q.eq("isOnline", true).lt("lastSeenAt", TWO_MINUTES_AGO),
      )
      .collect()

    await Promise.all(
      staleUsers.map((user) =>
        ctx.db.patch(user._id, {
          isOnline: false,
          activeSessions: 0,
        }),
      ),
    )

    const markedOfflineCount = staleUsers.length

    return { markedOfflineCount }
  },
})

export const getUserProfile = query({
  args: { username: v.string() },
  returns: v.union(userDocValidator, v.null()),
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    await ctx.db.patch(user._id, {
      name: args.name,
      username: args.username,
      bio: args.bio,
      location: args.location,
    })
    return null
  },
})

export const updateProfileImage = mutation({
  args: {
    imgUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    await ctx.db.patch(user._id, {
      image: args.imgUrl,
    })
    return null
  },
})

export const updateBannerImage = mutation({
  args: {
    bannerUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    await ctx.db.patch(user._id, {
      imageBanner: args.bannerUrl,
    })
    return null
  },
})

export const getAvailableUsername = query({
  args: {
    username: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const tokenIdentifier = identity?.tokenIdentifier

    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.neq(q.field("tokenIdentifier"), tokenIdentifier ?? ""))
      .unique()

    return !existingUsername
  },
})

export const updateOnboardingProfile = mutation({
  args: {
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    socialLinks: v.optional(v.array(socialLinkValidator)),
    allowAdultContent: v.optional(v.boolean()),
    onboardingCompleted: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    // Validate username uniqueness if provided
    if (args.username !== undefined) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique()
      if (existing && existing._id !== user._id) {
        throw new ConvexError("Cet identifiant est déjà pris.")
      }
    }

    const patch: Record<string, unknown> = {}
    if (args.username !== undefined) patch.username = args.username
    if (args.displayName !== undefined) patch.name = args.displayName
    if (args.bio !== undefined) patch.bio = args.bio
    if (args.location !== undefined) patch.location = args.location
    if (args.socialLinks !== undefined) patch.socialLinks = args.socialLinks
    if (args.allowAdultContent !== undefined) patch.allowAdultContent = args.allowAdultContent
    if (args.onboardingCompleted !== undefined) patch.onboardingCompleted = args.onboardingCompleted

    await ctx.db.patch(user._id, patch)
    return null
  },
})

export const suggestUsernames = query({
  args: { baseName: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    // Normalize base
    const base = args.baseName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 20)

    if (base.length < 3) return []

    const paddedBase = base.length < 6 ? base + "_fan" : base

    const candidates = [
      paddedBase,
      `${paddedBase}1`,
      `${paddedBase}2`,
      `${paddedBase.slice(0, 18)}07`,
      `${paddedBase.slice(0, 18)}99`,
      `${paddedBase.slice(0, 18)}vip`,
    ]
      .filter((c) => c.length >= 6 && c.length <= 24)
      // Must not end with underscore or contain more than 1 underscore (matches Zod username validation)
      .filter((c) => !c.endsWith("_") && (c.match(/_/g) || []).length <= 1)
      // Deduplicate
      .filter((c, i, arr) => arr.indexOf(c) === i)

    const results: string[] = []
    for (const candidate of candidates) {
      if (results.length >= 4) break
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", candidate))
        .unique()
      if (!existing) {
        results.push(candidate)
      }
    }
    return results
  },
})

export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(userDocValidator),
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

    const limit = args.limit ?? 10

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
      .take(limit)

    // Si on a assez de résultats via search index, retourner directement
    if (nameResults.length >= limit) {
      return nameResults.slice(0, limit)
    }

    // Recherche par username (substring match - limiter pour éviter full scan)
    // On prend max 200 users récents avec username pour la recherche substring
    const usersWithUsername = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), currentUser._id),
          q.neq(q.field("username"), undefined),
        ),
      )
      .take(200)

    // Filtrer par username avec early termination
    const seenIds = new Set(nameResults.map((u) => u._id))
    const usernameResults: typeof usersWithUsername = []
    const remaining = limit - nameResults.length

    for (const user of usersWithUsername) {
      if (
        !seenIds.has(user._id) &&
        user.username?.toLowerCase().includes(searchTermLower)
      ) {
        usernameResults.push(user)
        if (usernameResults.length >= remaining) break
      }
    }

    // Combiner les résultats (name results prioritaires)
    return [...nameResults, ...usernameResults].slice(0, limit)
  },
})

// Toggle pinned post (max 3 pinned posts)
export const togglePinnedPost = mutation({
  args: {
    postId: v.id("posts"),
    replaceOldest: v.optional(v.boolean()),
  },
  returns: v.object({
    pinned: v.boolean(),
    replaced: v.optional(v.id("posts")),
    maxReached: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

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
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      author: userDocValidator,
      content: v.string(),
      medias: v.array(postMediaValidator),
      visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
      isAdult: v.optional(v.boolean()),
      isMediaLocked: v.boolean(),
      mediaCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user || !user.pinnedPostIds?.length) return []

    // Determine viewer access once
    const currentUser = await getAuthenticatedUser(ctx, { optional: true })
    const canViewSubscribersOnly = currentUser
      ? currentUser._id === args.userId ||
        currentUser.accountType === "SUPERUSER" ||
        (await hasActiveSubscription(ctx, currentUser._id, args.userId, "content_access"))
      : false

    const posts = await Promise.all(
      user.pinnedPostIds.map((id) => ctx.db.get(id))
    )

    // Filter out deleted posts, apply media gating, enrich with author data
    return posts
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .map((post) => {
        const mediaCount = post.medias?.length || 0
        const isLocked = post.visibility === "subscribers_only" && !canViewSubscribersOnly
        return {
          ...post,
          medias: isLocked ? [] : post.medias || [],
          isMediaLocked: isLocked && mediaCount > 0,
          mediaCount,
          author: user,
        }
      })
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
          v.literal("linkedin"),
          v.literal("snapchat"),
          v.literal("facebook"),
          v.literal("website"),
          v.literal("other")
        ),
        url: v.string(),
        username: v.optional(v.string()),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate max 5 links
    if (args.socialLinks.length > 5) {
      throw new ConvexError("Maximum 5 liens sociaux autorisés")
    }

    const user = await getAuthenticatedUser(ctx)

    await ctx.db.patch(user._id, { socialLinks: args.socialLinks })
    return null
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
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireSuperuser(ctx)

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
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireSuperuser(ctx)

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
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    await ctx.db.patch(user._id, {
      allowAdultContent: args.allowAdultContent,
    })

    return { success: true }
  },
})

export const updateNotificationPreferences = mutation({
  args: {
    likes: v.optional(v.boolean()),
    comments: v.optional(v.boolean()),
    newPosts: v.optional(v.boolean()),
    subscriptions: v.optional(v.boolean()),
    messages: v.optional(v.boolean()),
    tips: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const currentPrefs = user.notificationPreferences || {}

    await ctx.db.patch(user._id, {
      notificationPreferences: {
        ...currentPrefs,
        ...args,
      },
    })

    return { success: true }
  },
})

export const updatePrivacySettings = mutation({
  args: {
    profileVisibility: v.optional(
      v.union(v.literal("public"), v.literal("private"))
    ),
    allowMessagesFromNonSubscribers: v.optional(v.boolean()),
    language: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const currentSettings = user.privacySettings || {}

    // Only merge defined fields to avoid setting undefined values
    const updates: Record<string, unknown> = {}
    if (args.profileVisibility !== undefined) {
      updates.profileVisibility = args.profileVisibility
    }
    if (args.allowMessagesFromNonSubscribers !== undefined) {
      updates.allowMessagesFromNonSubscribers = args.allowMessagesFromNonSubscribers
    }
    if (args.language !== undefined) {
      updates.language = args.language
    }

    await ctx.db.patch(user._id, {
      privacySettings: {
        ...currentSettings,
        ...updates,
      },
    })

    return { success: true }
  },
})
