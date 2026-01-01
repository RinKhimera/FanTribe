import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Constantes pour les soft locks
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export const submitApplication = mutation({
  args: {
    userId: v.id("users"),
    personalInfo: v.object({
      fullName: v.string(),
      dateOfBirth: v.string(),
      address: v.string(),
      phoneNumber: v.string(),
    }),
    applicationReason: v.string(),
    identityDocuments: v.array(
      v.object({
        type: v.union(
          v.literal("identity_card"),
          v.literal("passport"),
          v.literal("driving_license"),
          v.literal("selfie"),
        ),
        url: v.string(),
        publicId: v.string(),
        uploadedAt: v.number(),
      }),
    ),
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

    if (!currentUser || currentUser._id !== args.userId) {
      throw new Error("Unauthorized")
    }

    // Vérifier qu'il n'y a pas de candidature en cours (pending ou approved)
    const existingActiveApplication = await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("status"), "rejected"))
      .first()

    if (existingActiveApplication) {
      throw new Error("Une candidature est déjà en cours")
    }

    // Backend = source de vérité: calculer les stats depuis la DB
    const allApplications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()

    const attemptNumber = allApplications.length + 1
    const rejectedApps = allApplications.filter((a) => a.status === "rejected")
    const rejectionCount = rejectedApps.length

    // Trouver la candidature rejetée la plus récente (pour le lien et la raison)
    const previousRejected = rejectedApps.sort(
      (a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0)
    )[0]

    // Créer la nouvelle candidature
    await ctx.db.insert("creatorApplications", {
      userId: args.userId,
      status: "pending",
      personalInfo: args.personalInfo,
      applicationReason: args.applicationReason,
      identityDocuments: args.identityDocuments,
      submittedAt: Date.now(),
      attemptNumber,
      rejectionCount,
      previousRejectionReason: previousRejected?.adminNotes,
      previousApplicationId: previousRejected?._id,
    })

    return { success: true }
  },
})

export const getUserApplication = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    // Priorité: pending > approved > rejected (la plus récente)
    const pending = await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first()

    if (pending) return pending

    const approved = await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .first()

    if (approved) return approved

    // Retourner la candidature rejetée la plus récente
    return await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "rejected"))
      .order("desc")
      .first()
  },
})

// Admins
export const getAllApplications = query({
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

    const applications = await ctx.db
      .query("creatorApplications")
      .order("desc")
      .collect()

    const applicationsWithUsers = await Promise.all(
      applications.map(async (application) => {
        const user = await ctx.db.get(application.userId)
        return {
          ...application,
          user,
        }
      }),
    )

    return applicationsWithUsers
  },
})

export const getPendingApplications = query({
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

    const applications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()

    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const user = await ctx.db.get(app.userId)
        return { ...app, user }
      }),
    )

    return enrichedApplications
  },
})

export const getApplicationById = query({
  args: { applicationId: v.id("creatorApplications") },
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

    const application = await ctx.db.get(args.applicationId)
    if (!application) return null

    const user = await ctx.db.get(application.userId)
    return {
      ...application,
      user,
    }
  },
})

export const reviewApplication = mutation({
  args: {
    applicationId: v.id("creatorApplications"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
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

    const application = await ctx.db.get(args.applicationId)
    if (!application) throw new Error("Application not found")

    const now = Date.now()

    if (args.decision === "rejected") {
      // Compter tous les rejets de cet utilisateur (source de vérité = DB)
      const allRejections = await ctx.db
        .query("creatorApplications")
        .withIndex("by_userId", (q) => q.eq("userId", application.userId))
        .filter((q) => q.eq(q.field("status"), "rejected"))
        .collect()

      // Nouveau compteur = rejets existants + 1 (celui-ci)
      const newRejectionCount = allRejections.length + 1

      // Calculer le délai de repostulation selon le nombre de rejets
      let reapplicationAllowedAt: number | undefined

      if (newRejectionCount === 1) {
        // 1er rejet: peut repostuler immédiatement
        reapplicationAllowedAt = now
      } else if (newRejectionCount === 2) {
        // 2e rejet: doit attendre 24h
        reapplicationAllowedAt = now + TWENTY_FOUR_HOURS_MS
      }
      // 3e rejet+: reapplicationAllowedAt reste undefined = doit contacter support

      await ctx.db.patch(args.applicationId, {
        status: "rejected",
        adminNotes: args.adminNotes,
        reviewedAt: now,
        rejectionCount: newRejectionCount,
        reapplicationAllowedAt,
      })
    } else {
      // Approuvé
      await ctx.db.patch(args.applicationId, {
        status: "approved",
        adminNotes: args.adminNotes,
        reviewedAt: now,
      })

      await ctx.db.patch(application.userId, {
        accountType: "CREATOR",
      })
    }

    return { success: true }
  },
})

// Mutation pour demander une repostulation (vérifie le soft lock)
// NE SUPPRIME PLUS l'ancienne candidature - conserve l'historique complet
export const requestReapplication = mutation({
  args: {
    userId: v.id("users"),
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

    if (!currentUser || currentUser._id !== args.userId) {
      throw new Error("Unauthorized")
    }

    // Compter tous les rejets de cet utilisateur (source de vérité = DB)
    const allRejections = await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "rejected"))
      .collect()

    if (allRejections.length === 0) {
      throw new Error("Aucune candidature rejetée trouvée")
    }

    const rejectionCount = allRejections.length

    // Trouver la candidature rejetée la plus récente pour le soft lock
    const latestRejection = allRejections.sort(
      (a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0)
    )[0]
    const reapplicationAllowedAt = latestRejection.reapplicationAllowedAt
    const now = Date.now()

    // Vérifier le soft lock
    if (rejectionCount >= 3) {
      return {
        canReapply: false,
        mustContactSupport: true,
        waitUntil: null,
      }
    }

    if (reapplicationAllowedAt && now < reapplicationAllowedAt) {
      return {
        canReapply: false,
        mustContactSupport: false,
        waitUntil: reapplicationAllowedAt,
      }
    }

    // L'utilisateur peut repostuler
    // NE SUPPRIME PAS l'ancienne candidature - l'historique est conservé
    // NE RETOURNE PAS previousData - le backend calculera tout dans submitApplication
    return {
      canReapply: true,
      mustContactSupport: false,
      waitUntil: null,
    }
  },
})
