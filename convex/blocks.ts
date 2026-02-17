import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"
import { paginatedBlockedUsersValidator } from "./lib/validators"

export const blockUser = mutation({
  args: { targetUserId: v.id("users") },
  returns: v.object({
    already: v.optional(v.boolean()),
    blocked: v.optional(v.boolean()),
    blockId: v.id("blocks"),
  }),
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx)
    if (me._id === args.targetUserId)
      throw new ConvexError("Cannot block yourself")

    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", me._id).eq("blockedId", args.targetUserId),
      )
      .unique()
    if (existing) return { already: true, blockId: existing._id }

    const blockId = await ctx.db.insert("blocks", {
      blockerId: me._id,
      blockedId: args.targetUserId,
    })
    return { blocked: true, blockId }
  },
})

export const unblockUser = mutation({
  args: { targetUserId: v.id("users") },
  returns: v.object({ removed: v.boolean() }),
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx)
    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", me._id).eq("blockedId", args.targetUserId),
      )
      .unique()
    if (!existing) return { removed: false }
    await ctx.db.delete(existing._id)
    return { removed: true }
  },
})

// Liste des utilisateurs que j'ai bloqués (avec leurs infos)
export const getBlockedUsers = query({
  args: {},
  returns: v.array(v.object({
    block: v.any(),
    blockedUserDetails: v.any(),
  })),
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx)
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", me._id))
      .collect()

    const userIds = [...new Set(blocks.map((b) => b.blockedId))]
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const map = new Map(userIds.map((id, i) => [id, users[i]]))

    const result = blocks
      .map((b) => ({ block: b, blockedUserDetails: map.get(b.blockedId) }))
      .filter((b) => !!b.blockedUserDetails)
    return result
  },
})

// Paginated blocked users list (for /account/blocked page)
export const getBlockedUsersPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  returns: paginatedBlockedUsersValidator,
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx)

    const paginationResult = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", me._id))
      .order("desc")
      .paginate(args.paginationOpts)

    if (paginationResult.page.length === 0) {
      return { ...paginationResult, page: [] }
    }

    // Batch fetch blocked user details
    const blockedIds = [
      ...new Set(paginationResult.page.map((b) => b.blockedId)),
    ]
    const users = await Promise.all(blockedIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(blockedIds.map((id, i) => [id, users[i]]))

    let enriched = paginationResult.page
      .map((block) => {
        const user = userMap.get(block.blockedId)
        if (!user) return null
        return {
          blockId: block._id,
          blockedAt: block._creationTime,
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            image: user.image,
          },
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)

    // In-memory search filter
    if (args.search && args.search.trim().length > 0) {
      const term = args.search.toLowerCase()
      enriched = enriched.filter(
        (e) =>
          e.user.name.toLowerCase().includes(term) ||
          (e.user.username?.toLowerCase().includes(term) ?? false),
      )
    }

    return {
      ...paginationResult,
      page: enriched,
    }
  },
})

// Vérifie si moi j'ai bloqué target OU target m'a bloqué
export const isBlocked = query({
  args: { targetUserId: v.id("users") },
  returns: v.object({
    iBlocked: v.boolean(),
    blockedMe: v.boolean(),
    any: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx)
    if (me._id === args.targetUserId)
      return { iBlocked: false, blockedMe: false, any: false }

    const iBlocked = !!(await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", me._id).eq("blockedId", args.targetUserId),
      )
      .unique())

    const blockedMe = !!(await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", args.targetUserId).eq("blockedId", me._id),
      )
      .unique())

    return { iBlocked, blockedMe, any: iBlocked || blockedMe }
  },
})

// Statut directionnel sans double requête côté client
export const blockingStatus = query({
  args: { otherUserId: v.id("users") },
  returns: v.object({
    iBlocked: v.boolean(),
    blockedMe: v.boolean(),
    any: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx)
    if (me._id === args.otherUserId)
      return { iBlocked: false, blockedMe: false, any: false }

    const iBlocked = !!(await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", me._id).eq("blockedId", args.otherUserId),
      )
      .unique())

    const blockedMe = !!(await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", args.otherUserId).eq("blockedId", me._id),
      )
      .unique())

    return { iBlocked, blockedMe, any: iBlocked || blockedMe }
  },
})
