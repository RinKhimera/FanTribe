import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"

// Helper user courant
const getCurrentUser = async (ctx: MutationCtx | QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError("Not authenticated")
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique()
  if (!user) throw new ConvexError("User not found")
  return user
}

export const blockUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx)
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
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx)
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
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx)
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
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx)
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
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx)
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
