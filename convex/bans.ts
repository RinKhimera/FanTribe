import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Bannir un utilisateur (SUPERUSER only)
export const banUser = mutation({
  args: {
    userId: v.id("users"),
    banType: v.union(v.literal("temporary"), v.literal("permanent")),
    reason: v.string(),
    durationDays: v.optional(v.number()), // Required for temporary bans
    reportId: v.optional(v.id("reports")), // Link to originating report
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Non autorisé")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new ConvexError("Accès refusé - Réservé aux administrateurs")
    }

    // Get the user to ban
    const userToBan = await ctx.db.get(args.userId)
    if (!userToBan) {
      throw new ConvexError("Utilisateur introuvable")
    }

    // Cannot ban yourself
    if (userToBan._id === currentUser._id) {
      throw new ConvexError("Vous ne pouvez pas vous bannir vous-même")
    }

    // Cannot ban another superuser
    if (userToBan.accountType === "SUPERUSER") {
      throw new ConvexError("Vous ne pouvez pas bannir un administrateur")
    }

    // Check if already banned
    if (userToBan.isBanned) {
      throw new ConvexError("Cet utilisateur est déjà banni")
    }

    // For temporary bans, durationDays is required
    if (args.banType === "temporary" && !args.durationDays) {
      throw new ConvexError("La durée est requise pour un bannissement temporaire")
    }

    const now = Date.now()
    const banExpiresAt =
      args.banType === "temporary" && args.durationDays
        ? now + args.durationDays * 24 * 60 * 60 * 1000
        : undefined

    // Create ban history entry
    const banHistoryEntry = {
      type: args.banType,
      reason: args.reason,
      bannedAt: now,
      bannedBy: currentUser._id,
      expiresAt: banExpiresAt,
    }

    // Update user with ban info (écriture dans les deux formats pour compatibilité)
    await ctx.db.patch(args.userId, {
      isBanned: true,
      // Anciens champs (legacy, à supprimer après migration)
      banType: args.banType,
      banReason: args.reason,
      bannedAt: now,
      bannedBy: currentUser._id,
      banExpiresAt,
      // Nouveau format groupé
      banDetails: {
        type: args.banType,
        reason: args.reason,
        bannedAt: now,
        bannedBy: currentUser._id,
        expiresAt: banExpiresAt,
      },
      banHistory: [...(userToBan.banHistory || []), banHistoryEntry],
    })

    // If a report was provided, resolve it with "banned" action
    if (args.reportId) {
      const report = await ctx.db.get(args.reportId)
      if (report && (report.status === "pending" || report.status === "reviewing")) {
        await ctx.db.patch(args.reportId, {
          status: "resolved",
          resolutionAction: "banned",
          adminNotes: `Utilisateur banni: ${args.reason}`,
          reviewedBy: currentUser._id,
          reviewedAt: now,
        })
      }
    }

    return { success: true }
  },
})

// Lever le ban d'un utilisateur (SUPERUSER only)
export const unbanUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Non autorisé")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new ConvexError("Accès refusé - Réservé aux administrateurs")
    }

    const userToUnban = await ctx.db.get(args.userId)
    if (!userToUnban) {
      throw new ConvexError("Utilisateur introuvable")
    }

    if (!userToUnban.isBanned) {
      throw new ConvexError("Cet utilisateur n'est pas banni")
    }

    // Update ban history with lift info
    const updatedBanHistory = userToUnban.banHistory?.map((entry, index, arr) => {
      // Update the last entry (the current ban)
      if (index === arr.length - 1 && !entry.liftedAt) {
        return {
          ...entry,
          liftedAt: Date.now(),
          liftedBy: currentUser._id,
        }
      }
      return entry
    })

    // Clear ban fields (anciens + nouveau format)
    await ctx.db.patch(args.userId, {
      isBanned: false,
      // Anciens champs (legacy)
      banType: undefined,
      banReason: undefined,
      bannedAt: undefined,
      bannedBy: undefined,
      banExpiresAt: undefined,
      // Nouveau format
      banDetails: undefined,
      banHistory: updatedBanHistory,
    })

    return { success: true }
  },
})

// Récupérer tous les utilisateurs bannis (SUPERUSER only)
export const getAllBannedUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      return null
    }

    // Get all users with isBanned = true
    const allUsers = await ctx.db.query("users").collect()
    const bannedUsers = allUsers.filter((u) => u.isBanned === true)

    // Enrich with admin info
    const enrichedBannedUsers = await Promise.all(
      bannedUsers.map(async (user) => {
        const bannedByUser = user.bannedBy
          ? await ctx.db.get(user.bannedBy)
          : null

        return {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
          banType: user.banType,
          banReason: user.banReason,
          bannedAt: user.bannedAt,
          banExpiresAt: user.banExpiresAt,
          bannedByName: bannedByUser?.name || "Admin inconnu",
        }
      })
    )

    // Sort by bannedAt desc (most recent first)
    return enrichedBannedUsers.sort((a, b) => (b.bannedAt || 0) - (a.bannedAt || 0))
  },
})

// Récupérer l'historique des bans levés (SUPERUSER only)
export const getBanHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      return null
    }

    // Get all users with ban history
    const allUsers = await ctx.db.query("users").collect()
    const usersWithHistory = allUsers.filter(
      (u) => u.banHistory && u.banHistory.length > 0
    )

    // Flatten and enrich all lifted bans
    const liftedBans: {
      userId: typeof usersWithHistory[0]["_id"]
      userName: string
      username: string | undefined
      userImage: string | undefined
      banType: "temporary" | "permanent"
      reason: string
      bannedAt: number
      liftedAt: number
      bannedByName: string
      liftedByName: string
    }[] = []

    for (const user of usersWithHistory) {
      for (const entry of user.banHistory || []) {
        // Only include lifted bans
        if (entry.liftedAt) {
          const bannedByUser = await ctx.db.get(entry.bannedBy)
          const liftedByUser = entry.liftedBy
            ? await ctx.db.get(entry.liftedBy)
            : null

          liftedBans.push({
            userId: user._id,
            userName: user.name,
            username: user.username,
            userImage: user.image,
            banType: entry.type,
            reason: entry.reason,
            bannedAt: entry.bannedAt,
            liftedAt: entry.liftedAt,
            bannedByName: bannedByUser?.name || "Admin inconnu",
            liftedByName: liftedByUser?.name || "Admin inconnu",
          })
        }
      }
    }

    // Sort by liftedAt desc (most recent first)
    return liftedBans.sort((a, b) => b.liftedAt - a.liftedAt)
  },
})

// Récupérer les infos de ban d'un utilisateur (SUPERUSER only)
export const getUserBanInfo = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      return null
    }

    const user = await ctx.db.get(args.userId)
    if (!user) return null

    // Get admin info for ban history
    const banHistoryWithAdmins = await Promise.all(
      (user.banHistory || []).map(async (entry) => {
        const bannedByUser = await ctx.db.get(entry.bannedBy)
        const liftedByUser = entry.liftedBy
          ? await ctx.db.get(entry.liftedBy)
          : null

        return {
          ...entry,
          bannedByName: bannedByUser?.name || "Admin inconnu",
          liftedByName: liftedByUser?.name || null,
        }
      })
    )

    return {
      isBanned: user.isBanned || false,
      banType: user.banType,
      banReason: user.banReason,
      bannedAt: user.bannedAt,
      banExpiresAt: user.banExpiresAt,
      banHistory: banHistoryWithAdmins,
    }
  },
})
