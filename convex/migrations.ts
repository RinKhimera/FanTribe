/**
 * Migrations - Scripts de migration pour les changements de schéma
 *
 * Ces mutations internes sont exécutées manuellement via le dashboard Convex
 * pour migrer les données existantes vers les nouveaux formats.
 */
import { v } from "convex/values"
import { internalMutation } from "./_generated/server"

/**
 * Migration: banDetails
 *
 * Migre les anciens champs de ban (banType, banReason, bannedAt, bannedBy, banExpiresAt)
 * vers le nouvel objet banDetails.
 *
 * Exécuter cette migration après le déploiement du nouveau schéma.
 * Une fois terminée et vérifiée, les anciens champs peuvent être supprimés du schéma.
 */
export const migrateBanDetailsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        // Vérifier si l'utilisateur a des données de ban à migrer
        // et qu'il n'a pas déjà banDetails
        if (user.banType && user.banReason && !user.banDetails) {
          await ctx.db.patch(user._id, {
            banDetails: {
              type: user.banType,
              reason: user.banReason,
              bannedAt: user.bannedAt ?? Date.now(),
              bannedBy: user.bannedBy!,
              expiresAt: user.banExpiresAt,
            },
          })
          migratedCount++
        } else {
          skippedCount++
        }
      } catch (error) {
        console.error(`Failed to migrate user ${user._id}:`, error)
        errorCount++
      }
    }

    return {
      totalUsers: users.length,
      migratedCount,
      skippedCount,
      errorCount,
    }
  },
})

/**
 * Migration: personalInfo depuis creatorApplications
 *
 * Copie les informations personnelles des applications créateur approuvées
 * vers le nouveau champ personalInfo dans la table users.
 *
 * Cette migration ne supprime pas les données de creatorApplications,
 * elle les copie uniquement vers users pour un accès plus direct.
 */
export const migratePersonalInfoFromApplications = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Récupérer toutes les applications approuvées
    const approvedApplications = await ctx.db
      .query("creatorApplications")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect()

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const app of approvedApplications) {
      try {
        const user = await ctx.db.get(app.userId)
        if (!user) {
          skippedCount++
          continue
        }

        // Ne pas écraser si personalInfo existe déjà
        if (user.personalInfo) {
          skippedCount++
          continue
        }

        await ctx.db.patch(user._id, {
          personalInfo: {
            fullName: app.personalInfo.fullName,
            dateOfBirth: app.personalInfo.dateOfBirth,
            address: app.personalInfo.address,
            whatsappNumber: app.personalInfo.whatsappNumber,
            mobileMoneyNumber: app.personalInfo.mobileMoneyNumber,
            mobileMoneyNumber2: app.personalInfo.mobileMoneyNumber2,
          },
        })
        migratedCount++
      } catch (error) {
        console.error(`Failed to migrate personalInfo for user ${app.userId}:`, error)
        errorCount++
      }
    }

    return {
      totalApplications: approvedApplications.length,
      migratedCount,
      skippedCount,
      errorCount,
    }
  },
})

/**
 * Migration: Initialiser userStats pour tous les créateurs
 *
 * Calcule et crée les entrées userStats pour tous les créateurs existants.
 * À exécuter une fois après l'ajout des mises à jour incrémentales.
 */
export const initializeAllUserStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const creators = await ctx.db
      .query("users")
      .withIndex("by_accountType", (q) => q.eq("accountType", "CREATOR"))
      .collect()

    let createdCount = 0
    let updatedCount = 0
    let errorCount = 0

    for (const creator of creators) {
      try {
        // Compter les posts
        const posts = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("author", creator._id))
          .collect()

        // Compter les abonnés actifs
        const subscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_creator", (q) => q.eq("creator", creator._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect()

        // Compter les likes sur tous les posts
        let totalLikes = 0
        for (const post of posts) {
          const likes = await ctx.db
            .query("likes")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .collect()
          totalLikes += likes.length
        }

        // Vérifier si une entrée existe déjà
        const existingStats = await ctx.db
          .query("userStats")
          .withIndex("by_userId", (q) => q.eq("userId", creator._id))
          .unique()

        if (existingStats) {
          await ctx.db.patch(existingStats._id, {
            postsCount: posts.length,
            subscribersCount: subscriptions.length,
            totalLikes,
            lastUpdated: Date.now(),
          })
          updatedCount++
        } else {
          await ctx.db.insert("userStats", {
            userId: creator._id,
            postsCount: posts.length,
            subscribersCount: subscriptions.length,
            totalLikes,
            lastUpdated: Date.now(),
          })
          createdCount++
        }
      } catch (error) {
        console.error(`Failed to initialize stats for creator ${creator._id}:`, error)
        errorCount++
      }
    }

    return {
      totalCreators: creators.length,
      createdCount,
      updatedCount,
      errorCount,
    }
  },
})

/**
 * Nettoyage: Supprimer les anciens champs de ban après migration
 *
 * ATTENTION: N'exécuter qu'après avoir vérifié que la migration banDetails
 * a été effectuée avec succès et que le code utilise banDetails.
 */
export const cleanupLegacyBanFields = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true
    const users = await ctx.db.query("users").collect()

    let cleanedCount = 0
    const usersToClean: string[] = []

    for (const user of users) {
      // Vérifier si l'utilisateur a des anciens champs à nettoyer
      if (user.banType || user.banReason || user.bannedAt || user.bannedBy || user.banExpiresAt) {
        if (!dryRun) {
          await ctx.db.patch(user._id, {
            banType: undefined,
            banReason: undefined,
            bannedAt: undefined,
            bannedBy: undefined,
            banExpiresAt: undefined,
          })
        }
        usersToClean.push(user._id)
        cleanedCount++
      }
    }

    return {
      dryRun,
      totalUsers: users.length,
      cleanedCount,
      usersToClean: dryRun ? usersToClean : undefined,
    }
  },
})
