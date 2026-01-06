import { v } from "convex/values"
import { internalMutation, query } from "./_generated/server"

/**
 * Get counts for superuser navigation badges
 * Returns pending applications and reports counts in real-time
 */
export const getSuperuserCounts = query({
  args: {},
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
      .collect()

    // Count pending reports
    const pendingReports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()

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
      const allUsers = await ctx.db.query("users").collect()
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
        .collect()

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
        .collect()

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
    const allUsers = await ctx.db.query("users").collect()
    const creators = allUsers.filter((u) => u.accountType === "CREATOR")

    const allPosts = await ctx.db.query("posts").collect()
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000
    const postsThisWeek = allPosts.filter((p) => p._creationTime > oneWeekAgo)
    const postsLastWeek = allPosts.filter(
      (p) => p._creationTime > twoWeeksAgo && p._creationTime <= oneWeekAgo,
    )

    const pendingApplications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
    const approvedApplications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect()
    const allApplications = await ctx.db.query("creatorApplications").collect()

    const pendingReports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
    const allReports = await ctx.db.query("reports").collect()

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
 */
export const refreshPlatformStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Compter users par type
    const allUsers = await ctx.db.query("users").collect()
    const creators = allUsers.filter((u) => u.accountType === "CREATOR")

    // Compter posts
    const allPosts = await ctx.db.query("posts").collect()

    // Compter applications
    const pendingApps = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
    const approvedApps = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect()
    const allApps = await ctx.db.query("creatorApplications").collect()

    // Compter reports
    const pendingReports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
    const allReports = await ctx.db.query("reports").collect()

    // Vérifier si platformStats existe déjà
    const existingStats = await ctx.db.query("platformStats").first()

    const stats = {
      totalUsers: allUsers.length,
      totalCreators: creators.length,
      totalPosts: allPosts.length,
      pendingApplications: pendingApps.length,
      approvedApplications: approvedApps.length,
      totalApplications: allApps.length,
      pendingReports: pendingReports.length,
      totalReports: allReports.length,
      lastUpdated: Date.now(),
    }

    if (existingStats) {
      await ctx.db.patch(existingStats._id, stats)
    } else {
      await ctx.db.insert("platformStats", stats)
    }

    return stats
  },
})
