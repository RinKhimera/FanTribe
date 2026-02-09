import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"

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
