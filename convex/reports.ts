import { ConvexError, v } from "convex/values"
import { api } from "./_generated/api"
import { mutation, query } from "./_generated/server"

// Créer un signalement
export const createReport = mutation({
  args: {
    reportedUserId: v.optional(v.id("users")),
    reportedPostId: v.optional(v.id("posts")),
    reportedCommentId: v.optional(v.id("comments")),
    type: v.union(v.literal("user"), v.literal("post"), v.literal("comment")),
    reason: v.union(
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("inappropriate_content"),
      v.literal("fake_account"),
      v.literal("copyright"),
      v.literal("violence"),
      v.literal("hate_speech"),
      v.literal("other"),
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser) throw new Error("User not found")

    // Vérifier qu'il y a soit un utilisateur, soit un post, soit un commentaire signalé
    if (
      !args.reportedUserId &&
      !args.reportedPostId &&
      !args.reportedCommentId
    ) {
      throw new Error("Must report either a user, a post, or a comment")
    }

    // Vérifier que l'utilisateur ne signale pas lui-même
    if (args.reportedUserId === currentUser._id) {
      throw new Error("Cannot report yourself")
    }

    // Vérifier que l'utilisateur ne signale pas son propre contenu
    if (args.reportedPostId) {
      const post = await ctx.db.get(args.reportedPostId)
      if (post && post.author === currentUser._id) {
        throw new Error("Cannot report your own post")
      }
    }

    if (args.reportedCommentId) {
      const comment = await ctx.db.get(args.reportedCommentId)
      if (comment && comment.author === currentUser._id) {
        throw new Error("Cannot report your own comment")
      }
    }

    // Vérifier les doublons - empêcher de signaler plusieurs fois le même contenu
    if (args.reportedPostId) {
      const existingReport = await ctx.db
        .query("reports")
        .withIndex("by_reporter_post", (q) =>
          q
            .eq("reporterId", currentUser._id)
            .eq("reportedPostId", args.reportedPostId),
        )
        .first()
      if (existingReport) {
        return {
          success: false,
          duplicate: true,
          message: "Vous avez déjà signalé cette publication",
        }
      }
    }

    if (args.reportedUserId && args.type === "user") {
      const existingReport = await ctx.db
        .query("reports")
        .withIndex("by_reporter_user", (q) =>
          q
            .eq("reporterId", currentUser._id)
            .eq("reportedUserId", args.reportedUserId),
        )
        .filter((q) => q.eq(q.field("type"), "user"))
        .first()
      if (existingReport) {
        return {
          success: false,
          duplicate: true,
          message: "Vous avez déjà signalé cet utilisateur",
        }
      }
    }

    if (args.reportedCommentId) {
      const existingReport = await ctx.db
        .query("reports")
        .withIndex("by_reporter_comment", (q) =>
          q
            .eq("reporterId", currentUser._id)
            .eq("reportedCommentId", args.reportedCommentId),
        )
        .first()
      if (existingReport) {
        return {
          success: false,
          duplicate: true,
          message: "Vous avez déjà signalé ce commentaire",
        }
      }
    }

    await ctx.db.insert("reports", {
      reporterId: currentUser._id,
      reportedUserId: args.reportedUserId,
      reportedPostId: args.reportedPostId,
      reportedCommentId: args.reportedCommentId,
      type: args.type,
      reason: args.reason,
      description: args.description,
      status: "pending",
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

// Récupérer tous les signalements (Admin seulement)
export const getAllReports = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Unauthorized")
    }

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_created_at")
      .order("desc")
      .collect()

    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId)

        let reportedUser = null
        if (report.reportedUserId) {
          reportedUser = await ctx.db.get(report.reportedUserId)
        }

        let reportedPost = null
        if (report.reportedPostId) {
          reportedPost = await ctx.db.get(report.reportedPostId)
          if (reportedPost) {
            const postAuthor = await ctx.db.get(reportedPost.author)
            reportedPost = { ...reportedPost, author: postAuthor }
          }
        }

        let reportedComment = null
        if (report.reportedCommentId) {
          reportedComment = await ctx.db.get(report.reportedCommentId)
          if (reportedComment) {
            const commentAuthor = await ctx.db.get(reportedComment.author)
            const commentPost = await ctx.db.get(reportedComment.post)
            reportedComment = {
              ...reportedComment,
              author: commentAuthor,
              post: commentPost,
            }
          }
        }

        let reviewedBy = null
        if (report.reviewedBy) {
          reviewedBy = await ctx.db.get(report.reviewedBy)
        }

        return {
          ...report,
          reporter,
          reportedUser,
          reportedPost,
          reportedComment,
          reviewedByUser: reviewedBy,
        }
      }),
    )

    return enrichedReports
  },
})

// Mettre à jour le statut d'un signalement
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(v.literal("pending"), v.literal("resolved")),
    resolutionAction: v.optional(
      v.union(
        v.literal("banned"),
        v.literal("content_deleted"),
        v.literal("dismissed"),
      ),
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
      resolutionAction: args.resolutionAction,
      adminNotes: args.adminNotes,
      reviewedBy: currentUser._id,
      reviewedAt: Date.now(),
    })

    return { success: true }
  },
})

// Récupérer les statistiques des signalements
export const getReportsStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Unauthorized")
    }

    const allReports = await ctx.db.query("reports").collect()

    const stats = {
      total: allReports.length,
      pending: allReports.filter((r) => r.status === "pending").length,
      reviewing: allReports.filter((r) => r.status === "reviewing").length,
      resolved: allReports.filter((r) => r.status === "resolved").length,
      rejected: allReports.filter((r) => r.status === "rejected").length,
      userReports: allReports.filter((r) => r.type === "user").length,
      postReports: allReports.filter((r) => r.type === "post").length,
      commentReports: allReports.filter((r) => r.type === "comment").length,
    }

    return stats
  },
})

// Récupérer un signalement par ID
export const getReportById = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Unauthorized")
    }

    const report = await ctx.db.get(args.reportId)
    if (!report) return null

    const reporter = await ctx.db.get(report.reporterId)

    let reportedUser = null
    if (report.reportedUserId) {
      reportedUser = await ctx.db.get(report.reportedUserId)
    }

    let reportedPost = null
    if (report.reportedPostId) {
      reportedPost = await ctx.db.get(report.reportedPostId)
      if (reportedPost) {
        const postAuthor = await ctx.db.get(reportedPost.author)
        reportedPost = { ...reportedPost, author: postAuthor }
      }
    }

    let reportedComment = null
    if (report.reportedCommentId) {
      reportedComment = await ctx.db.get(report.reportedCommentId)
      if (reportedComment) {
        const commentAuthor = await ctx.db.get(reportedComment.author)
        const commentPost = await ctx.db.get(reportedComment.post)
        reportedComment = {
          ...reportedComment,
          author: commentAuthor,
          post: commentPost,
        }
      }
    }

    let reviewedBy = null
    if (report.reviewedBy) {
      reviewedBy = await ctx.db.get(report.reviewedBy)
    }

    return {
      ...report,
      reporter,
      reportedUser,
      reportedPost,
      reportedComment,
      reviewedByUser: reviewedBy,
    }
  },
})

// Supprimer le contenu signalé et résoudre le signalement
export const deleteReportedContentAndResolve = mutation({
  args: {
    reportId: v.id("reports"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Unauthorized")
    }

    const report = await ctx.db.get(args.reportId)
    if (!report) throw new Error("Report not found")

    // Supprimer le contenu selon le type
    if (report.type === "post" && report.reportedPostId) {
      const reportedPost = await ctx.db.get(report.reportedPostId)
      if (!reportedPost) throw new ConvexError("Post not found")

      // Suppression des médias Bunny.net en parallèle
      if (reportedPost.medias && reportedPost.medias.length > 0) {
        const uniqueMedias = [...new Set(reportedPost.medias)]
        await ctx.scheduler
          .runAfter(0, api.internalActions.deleteMultipleBunnyAssets, {
            mediaUrls: uniqueMedias,
          })
          .catch((error) => {
            console.error(
              `Failed to schedule Bunny assets deletion for reported post ${reportedPost._id}:`,
              error,
            )
          })
      }

      // Récupérations parallèles des entités associées (comments, likes, bookmarks, notifications)
      const [comments, likes, bookmarks, notifications] = await Promise.all([
        ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("post", reportedPost._id))
          .collect(),
        ctx.db
          .query("likes")
          .withIndex("by_post", (q) => q.eq("postId", reportedPost._id))
          .collect(),
        ctx.db
          .query("bookmarks")
          .withIndex("by_post", (q) => q.eq("postId", reportedPost._id))
          .collect(),
        ctx.db
          .query("notifications")
          .withIndex("by_post", (q) => q.eq("post", reportedPost._id))
          .collect(),
      ])

      // Suppressions en parallèle contrôlée
      await Promise.all([
        ...comments.map((c) => ctx.db.delete(c._id)),
        ...likes.map((l) => ctx.db.delete(l._id)),
        ...bookmarks.map((b) => ctx.db.delete(b._id)),
        ...notifications.map((n) => ctx.db.delete(n._id)),
      ])

      // Supprimer le post lui-même
      await ctx.db.delete(report.reportedPostId)
    } else if (report.type === "comment" && report.reportedCommentId) {
      const comment = await ctx.db.get(report.reportedCommentId)
      if (comment) {
        // Supprimer les notifications liées à ce commentaire
        const notifications = await ctx.db
          .query("notifications")
          .filter((q) => q.eq(q.field("comment"), report.reportedCommentId))
          .collect()
        for (const notification of notifications) {
          await ctx.db.delete(notification._id)
        }
        // Supprimer le commentaire (pas de patch sur le post: champ comments inexistant)
        await ctx.db.delete(report.reportedCommentId)
      }
    }

    // Marquer le signalement comme résolu avec action "content_deleted"
    await ctx.db.patch(args.reportId, {
      status: "resolved",
      resolutionAction: "content_deleted",
      adminNotes: args.adminNotes,
      reviewedBy: currentUser._id,
      reviewedAt: Date.now(),
    })

    return { success: true }
  },
})

// Récupérer l'historique des signalements pour un utilisateur (SUPERUSER only)
export const getReportHistoryForUser = query({
  args: {
    userId: v.id("users"),
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

    // Get reports where this user is directly reported
    const userReports = await ctx.db
      .query("reports")
      .withIndex("by_reported_user", (q) => q.eq("reportedUserId", args.userId))
      .filter((q) => q.eq(q.field("type"), "user"))
      .collect()

    // Get user's posts to find reports on their posts
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", args.userId))
      .collect()
    const postIds = new Set(userPosts.map((p) => p._id))

    // Get user's comments to find reports on their comments
    const userComments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("author", args.userId))
      .collect()
    const commentIds = new Set(userComments.map((c) => c._id))

    // Get all post and comment reports and filter
    const allPostReports = await ctx.db
      .query("reports")
      .withIndex("by_type", (q) => q.eq("type", "post"))
      .collect()
    const postReports = allPostReports.filter(
      (r) => r.reportedPostId && postIds.has(r.reportedPostId),
    )

    const allCommentReports = await ctx.db
      .query("reports")
      .withIndex("by_type", (q) => q.eq("type", "comment"))
      .collect()
    const commentReports = allCommentReports.filter(
      (r) => r.reportedCommentId && commentIds.has(r.reportedCommentId),
    )

    // Combine all reports
    const allReports = [...userReports, ...postReports, ...commentReports].sort(
      (a, b) => b.createdAt - a.createdAt,
    )

    // Get recent reports with details
    const recentReports = await Promise.all(
      allReports.slice(0, 10).map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId)
        return {
          _id: report._id,
          type: report.type,
          reason: report.reason,
          status: report.status,
          createdAt: report.createdAt,
          reporterName: reporter?.name || "Utilisateur inconnu",
        }
      }),
    )

    const totalReports = allReports.length
    const RECIDIVIST_THRESHOLD = 3

    return {
      totalReports,
      userReports: userReports.length,
      postReports: postReports.length,
      commentReports: commentReports.length,
      recentReports,
      isRecidivist: totalReports >= RECIDIVIST_THRESHOLD,
    }
  },
})
