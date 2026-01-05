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
      whatsappNumber: v.string(),
      mobileMoneyNumber: v.string(),
      mobileMoneyNumber2: v.optional(v.string()),
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

    // Single query: fetch all applications and filter in memory
    const allApplications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()

    // Check for active application (pending or approved)
    const existingActiveApplication = allApplications.find(
      (a) => a.status !== "rejected",
    )

    if (existingActiveApplication) {
      throw new Error("Une candidature est déjà en cours")
    }

    // Backend = source de vérité: calculer les stats depuis la DB
    const attemptNumber = allApplications.length + 1
    const rejectedApps = allApplications.filter((a) => a.status === "rejected")
    const rejectionCount = rejectedApps.length

    // Trouver la candidature rejetée la plus récente (pour le lien et la raison)
    const previousRejected = rejectedApps.sort(
      (a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0),
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

    // Supprimer les drafts de documents de l'utilisateur SANS supprimer les fichiers Bunny
    const draftDocuments = await ctx.db
      .query("validationDocumentsDraft")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()

    for (const doc of draftDocuments) {
      await ctx.db.delete(doc._id)
    }

    return { success: true }
  },
})

export const getUserApplication = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    // Single query: fetch all and prioritize in memory
    const applications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    if (applications.length === 0) return null

    // Priority: pending > approved > rejected (most recent)
    const pending = applications.find((a) => a.status === "pending")
    if (pending) return pending

    const approved = applications.find((a) => a.status === "approved")
    if (approved) return approved

    // Return the most recent rejected (already sorted desc)
    return applications.find((a) => a.status === "rejected") ?? null
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

    if (applications.length === 0) return []

    // Batch fetch all users
    const userIds = [...new Set(applications.map((a) => a.userId))]
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(users.filter(Boolean).map((u) => [u!._id, u]))

    return applications.map((application) => ({
      ...application,
      user: userMap.get(application.userId) ?? null,
    }))
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

    if (applications.length === 0) return []

    // Batch fetch all users
    const userIds = [...new Set(applications.map((a) => a.userId))]
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(users.filter(Boolean).map((u) => [u!._id, u]))

    return applications.map((app) => ({
      ...app,
      user: userMap.get(app.userId) ?? null,
    }))
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

    // Empêcher de rejeter une candidature déjà approuvée
    if (args.decision === "rejected" && application.status === "approved") {
      throw new Error(
        "Impossible de rejeter une candidature déjà approuvée. Utilisez la révocation du statut créateur.",
      )
    }

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
      (a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0),
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

// Révoquer le statut créateur d'un utilisateur (le repasser en USER)
export const revokeCreatorStatus = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
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

    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) throw new Error("Utilisateur non trouvé")

    // Vérifier que l'utilisateur est bien un créateur
    if (targetUser.accountType !== "CREATOR") {
      throw new Error("L'utilisateur n'est pas un créateur")
    }

    // Rétrograder en USER
    await ctx.db.patch(args.userId, {
      accountType: "USER",
    })

    // Trouver et rejeter la candidature approuvée
    const approvedApplication = await ctx.db
      .query("creatorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .first()

    if (approvedApplication) {
      await ctx.db.patch(approvedApplication._id, {
        status: "rejected",
        adminNotes:
          args.reason || "Statut créateur révoqué par un administrateur",
        reviewedAt: Date.now(),
      })
    }

    return { success: true }
  },
})
