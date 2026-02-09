import { v } from "convex/values"
import { internalMutation, query } from "./_generated/server"

/**
 * Get counts for superuser navigation badges
 * Returns pending applications and reports counts in real-time
 */
export const getSuperuserCounts = query({
  args: {},
  returns: v.union(
    v.object({
      pendingApplications: v.number(),
      pendingReports: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      return null
    }

    // Count pending applications
    const pendingApplications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(500)

    // Count pending reports
    const pendingReports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(500)

    return {
      pendingApplications: pendingApplications.length,
      pendingReports: pendingReports.length,
    }
  },
})

/**
 * Global search across users, applications, and reports
 */
export const globalSearch = query({
  args: {
    searchQuery: v.string(),
    category: v.optional(
      v.union(
        v.literal("all"),
        v.literal("users"),
        v.literal("applications"),
        v.literal("reports"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      users: v.array(
        v.object({
          _id: v.string(),
          name: v.string(),
          username: v.string(),
          email: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
      ),
      applications: v.array(
        v.object({
          _id: v.string(),
          fullName: v.string(),
          email: v.optional(v.string()),
          status: v.string(),
          submittedAt: v.number(),
        }),
      ),
      reports: v.array(
        v.object({
          _id: v.string(),
          type: v.string(),
          reason: v.string(),
          status: v.string(),
          createdAt: v.number(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      return null
    }

    const query = args.searchQuery.toLowerCase().trim()
    if (!query) return { users: [], applications: [], reports: [] }

    const limit = args.limit ?? 5
    const category = args.category ?? "all"

    const results: {
      users: Array<{
        _id: string
        name: string
        username: string
        email?: string
        imageUrl?: string
      }>
      applications: Array<{
        _id: string
        fullName: string
        email?: string
        status: string
        submittedAt: number
      }>
      reports: Array<{
        _id: string
        type: string
        reason: string
        status: string
        createdAt: number
      }>
    } = {
      users: [],
      applications: [],
      reports: [],
    }

    // Search users
    if (category === "all" || category === "users") {
      const allUsers = await ctx.db.query("users").take(1000)
      results.users = allUsers
        .filter(
          (user) =>
            user.name?.toLowerCase().includes(query) ||
            user.username?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query),
        )
        .slice(0, limit)
        .map((user) => ({
          _id: user._id,
          name: user.name ?? "",
          username: user.username ?? "",
          email: user.email,
          imageUrl: user.image,
        }))
    }

    // Search applications
    if (category === "all" || category === "applications") {
      const allApplications = await ctx.db
        .query("creatorApplications")
        .order("desc")
        .take(500)

      const applicationsWithUsers = await Promise.all(
        allApplications.map(async (app) => {
          const user = await ctx.db.get(app.userId)
          return { ...app, user }
        }),
      )

      results.applications = applicationsWithUsers
        .filter(
          (app) =>
            app.personalInfo?.fullName?.toLowerCase().includes(query) ||
            app.user?.email?.toLowerCase().includes(query) ||
            app.user?.username?.toLowerCase().includes(query),
        )
        .slice(0, limit)
        .map((app) => ({
          _id: app._id,
          fullName: app.personalInfo?.fullName ?? "",
          email: app.user?.email,
          status: app.status,
          submittedAt: app.submittedAt,
        }))
    }

    // Search reports
    if (category === "all" || category === "reports") {
      const allReports = await ctx.db
        .query("reports")
        .order("desc")
        .take(500)

      results.reports = allReports
        .filter(
          (report) =>
            report.reason?.toLowerCase().includes(query) ||
            report.description?.toLowerCase().includes(query),
        )
        .slice(0, limit)
        .map((report) => ({
          _id: report._id,
          type: report.type,
          reason: report.reason,
          status: report.status,
          createdAt: report.createdAt,
        }))
    }

    return results
  },
})

/**
 * Get dashboard statistics for superuser
 * Utilise platformStats dénormalisées si disponibles (beaucoup plus rapide)
 */
export const getDashboardStats = query({
  args: {},
  returns: v.union(
    v.object({
      users: v.object({
        total: v.number(),
        creators: v.number(),
        regular: v.number(),
      }),
      posts: v.object({
        total: v.number(),
        thisWeek: v.number(),
        trend: v.number(),
      }),
      applications: v.object({
        total: v.number(),
        pending: v.number(),
        approved: v.number(),
        approvalRate: v.number(),
      }),
      reports: v.object({
        total: v.number(),
        pending: v.number(),
      }),
      fromCache: v.boolean(),
      cacheAge: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      return null
    }

    // Essayer d'utiliser les stats dénormalisées
    const cachedStats = await ctx.db.query("platformStats").first()

    // Si stats existent et fraîches (< 5 min), les utiliser
    const FIVE_MINUTES = 5 * 60 * 1000
    const now = Date.now()

    if (cachedStats && now - cachedStats.lastUpdated < FIVE_MINUTES) {
      return {
        users: {
          total: cachedStats.totalUsers,
          creators: cachedStats.totalCreators,
          regular: cachedStats.totalUsers - cachedStats.totalCreators,
        },
        posts: {
          total: cachedStats.totalPosts,
          thisWeek: 0, // Non disponible dans le cache simple
          trend: 0,
        },
        applications: {
          total: cachedStats.totalApplications,
          pending: cachedStats.pendingApplications,
          approved: cachedStats.approvedApplications,
          approvalRate:
            cachedStats.totalApplications > 0
              ? Math.round(
                  (cachedStats.approvedApplications /
                    cachedStats.totalApplications) *
                    100,
                )
              : 0,
        },
        reports: {
          total: cachedStats.totalReports,
          pending: cachedStats.pendingReports,
        },
        fromCache: true,
        cacheAge: Math.round((now - cachedStats.lastUpdated) / 1000),
      }
    }

    // Fallback: calcul complet (si pas de cache ou cache périmé)
    const allUsers = await ctx.db.query("users").take(10000)
    const creators = allUsers.filter((u) => u.accountType === "CREATOR")

    const allPosts = await ctx.db.query("posts").take(10000)
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000
    const postsThisWeek = allPosts.filter((p) => p._creationTime > oneWeekAgo)
    const postsLastWeek = allPosts.filter(
      (p) => p._creationTime > twoWeeksAgo && p._creationTime <= oneWeekAgo,
    )

    const pendingApplications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(500)
    const approvedApplications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .take(500)
    const allApplications = await ctx.db.query("creatorApplications").take(1000)

    const pendingReports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(500)
    const allReports = await ctx.db.query("reports").take(1000)

    const postsTrend =
      postsLastWeek.length > 0
        ? Math.round(
            ((postsThisWeek.length - postsLastWeek.length) /
              postsLastWeek.length) *
              100,
          )
        : postsThisWeek.length > 0
          ? 100
          : 0

    return {
      users: {
        total: allUsers.length,
        creators: creators.length,
        regular: allUsers.length - creators.length,
      },
      posts: {
        total: allPosts.length,
        thisWeek: postsThisWeek.length,
        trend: postsTrend,
      },
      applications: {
        total: allApplications.length,
        pending: pendingApplications.length,
        approved: approvedApplications.length,
        approvalRate:
          allApplications.length > 0
            ? Math.round(
                (approvedApplications.length / allApplications.length) * 100,
              )
            : 0,
      },
      reports: {
        total: allReports.length,
        pending: pendingReports.length,
      },
      fromCache: false,
    }
  },
})

/**
 * Rafraîchir les stats de la plateforme (appelé par cron ou manuellement)
 * Optimisé : queries parallèles + conditional update
 */
export const refreshPlatformStats = internalMutation({
  args: {},
  returns: v.object({
    totalUsers: v.number(),
    totalCreators: v.number(),
    totalPosts: v.number(),
    pendingApplications: v.number(),
    approvedApplications: v.number(),
    totalApplications: v.number(),
    pendingReports: v.number(),
    totalReports: v.number(),
    lastUpdated: v.number(),
  }),
  handler: async (ctx) => {
    // Exécuter toutes les queries en parallèle (4 au lieu de 8)
    const [allUsers, allPosts, allApplications, allReports] = await Promise.all(
      [
        ctx.db.query("users").collect(),
        ctx.db.query("posts").collect(),
        ctx.db.query("creatorApplications").collect(),
        ctx.db.query("reports").collect(),
      ],
    )

    // Compter en mémoire (plus rapide que queries multiples)
    const totalCreators = allUsers.filter(
      (u) => u.accountType === "CREATOR",
    ).length
    const pendingApplications = allApplications.filter(
      (a) => a.status === "pending",
    ).length
    const approvedApplications = allApplications.filter(
      (a) => a.status === "approved",
    ).length
    const pendingReports = allReports.filter(
      (r) => r.status === "pending",
    ).length

    const newStats = {
      totalUsers: allUsers.length,
      totalCreators,
      totalPosts: allPosts.length,
      pendingApplications,
      approvedApplications,
      totalApplications: allApplications.length,
      pendingReports,
      totalReports: allReports.length,
      lastUpdated: Date.now(),
    }

    const existingStats = await ctx.db.query("platformStats").first()

    if (existingStats) {
      // Conditional update: écrire seulement si changement
      const hasChanges =
        existingStats.totalUsers !== newStats.totalUsers ||
        existingStats.totalCreators !== newStats.totalCreators ||
        existingStats.totalPosts !== newStats.totalPosts ||
        existingStats.pendingApplications !== newStats.pendingApplications ||
        existingStats.approvedApplications !== newStats.approvedApplications ||
        existingStats.totalApplications !== newStats.totalApplications ||
        existingStats.pendingReports !== newStats.pendingReports ||
        existingStats.totalReports !== newStats.totalReports

      if (hasChanges) {
        await ctx.db.patch(existingStats._id, newStats)
      }
      // Si pas de changement, on n'écrit pas (économie de bandwidth)
    } else {
      await ctx.db.insert("platformStats", newStats)
    }

    return newStats
  },
})
