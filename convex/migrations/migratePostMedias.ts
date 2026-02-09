/**
 * Migration: Convert posts.medias from string[] to PostMedia[]
 *
 * Fonctions visibles dans le dashboard Convex :
 *
 * 1. `checkMigrationStatus` (query) — État actuel : combien de posts migrés/non migrés
 * 2. `previewMigration` (query) — Aperçu des 10 premiers posts à migrer (avant/après)
 * 3. `run` (action) — Lance la migration complète avec rapport détaillé
 * 4. `verifyMigration` (query) — Vérifie que tout est bien migré, détecte les anomalies
 * 5. `sampleMigratedPosts` (query) — Échantillon de posts migrés pour vérif manuelle
 *
 * Ces fonctions sont destinées à être lancées depuis le dashboard Convex.
 */
import { v } from "convex/values"
import { internal } from "../_generated/api"
import { Id } from "../_generated/dataModel"
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "../_generated/server"

const BATCH_SIZE = 100

type PostMedia = {
  type: "image" | "video"
  url: string
  mediaId: string
  mimeType: string
}

// ============================================================================
// HELPERS
// ============================================================================

/** Normalize a single media entry from string to PostMedia */
function normalizeMedia(m: unknown): PostMedia {
  if (
    typeof m === "object" &&
    m !== null &&
    "type" in m &&
    "url" in m &&
    "mediaId" in m
  ) {
    return m as PostMedia
  }

  const url = String(m)
  const isVideo = url.startsWith("https://iframe.mediadelivery.net/embed/")
  if (isVideo) {
    const guidMatch = url.match(/\/embed\/\d+\/([^?/]+)/)
    return {
      type: "video",
      url,
      mediaId: guidMatch ? guidMatch[1] : url,
      mimeType: "video/mp4",
    }
  }

  const pathMatch = url.match(/https:\/\/[^/]+\/(.+)/)
  return {
    type: "image",
    url,
    mediaId: pathMatch ? pathMatch[1] : url,
    mimeType: "image/jpeg",
  }
}

/** Check if a media entry is old format (plain string) */
function isOldFormat(m: unknown): boolean {
  return typeof m === "string"
}

/** Check if a media entry is new format (PostMedia object) */
function isNewFormat(m: unknown): boolean {
  return (
    typeof m === "object" &&
    m !== null &&
    "type" in m &&
    "url" in m &&
    "mediaId" in m &&
    "mimeType" in m
  )
}

// ============================================================================
// 1. CHECK MIGRATION STATUS (query — visible dans le dashboard)
// ============================================================================

/**
 * Retourne l'état actuel de la migration :
 * - Combien de posts au total
 * - Combien ont TOUS leurs médias migrés (nouveau format)
 * - Combien ont au moins un média en ancien format (string)
 * - Combien n'ont aucun média
 */
export const checkMigrationStatus = query({
  args: {},
  returns: v.object({
    totalPosts: v.number(),
    postsWithoutMedia: v.number(),
    fullyMigrated: v.number(),
    needsMigration: v.number(),
    mixedFormat: v.number(),
    totalMediaEntries: v.number(),
    oldFormatEntries: v.number(),
    newFormatEntries: v.number(),
    migrationComplete: v.boolean(),
  }),
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect()

    let postsWithoutMedia = 0
    let fullyMigrated = 0
    let needsMigration = 0
    let mixedFormat = 0
    let totalMediaEntries = 0
    let oldFormatEntries = 0
    let newFormatEntries = 0

    for (const post of posts) {
      const medias = post.medias || []
      if (medias.length === 0) {
        postsWithoutMedia++
        continue
      }

      totalMediaEntries += medias.length
      const oldCount = medias.filter(isOldFormat).length
      const newCount = medias.filter(isNewFormat).length

      oldFormatEntries += oldCount
      newFormatEntries += newCount

      if (oldCount === 0 && newCount === medias.length) {
        fullyMigrated++
      } else if (oldCount > 0 && newCount > 0) {
        mixedFormat++
        needsMigration++
      } else if (oldCount > 0) {
        needsMigration++
      }
    }

    return {
      totalPosts: posts.length,
      postsWithoutMedia,
      fullyMigrated,
      needsMigration,
      mixedFormat,
      totalMediaEntries,
      oldFormatEntries,
      newFormatEntries,
      migrationComplete: needsMigration === 0 && mixedFormat === 0,
    }
  },
})

// ============================================================================
// 2. PREVIEW MIGRATION (query — voir ce qui va être migré, avant/après)
// ============================================================================

/**
 * Retourne un aperçu des N premiers posts à migrer avec le avant/après.
 * Permet de vérifier que la conversion est correcte AVANT de lancer.
 */
export const previewMigration = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      postId: v.id("posts"),
      createdAt: v.number(),
      mediaCount: v.number(),
      before: v.array(v.any()),
      after: v.array(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10
    const posts = await ctx.db.query("posts").order("desc").take(500)

    const postsToMigrate = posts.filter((post) =>
      post.medias?.some((m: unknown) => typeof m === "string"),
    )

    return postsToMigrate.slice(0, limit).map((post) => ({
      postId: post._id,
      createdAt: post._creationTime,
      mediaCount: post.medias?.length || 0,
      before: (post.medias || []) as unknown[],
      after: (post.medias || []).map(normalizeMedia) as unknown[],
    }))
  },
})

// ============================================================================
// 3. RUN MIGRATION (action — lance la migration complète)
// ============================================================================

/** Internal: fetch batch for migration */
export const _getPostsToMigrate = internalQuery({
  args: { cursor: v.optional(v.string()) },
  returns: v.object({
    posts: v.array(
      v.object({
        _id: v.id("posts"),
        medias: v.array(v.any()),
      }),
    ),
    cursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const paginationResult = await ctx.db.query("posts").paginate({
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    })

    const postsToMigrate = paginationResult.page
      .filter((post) =>
        post.medias?.some((m: unknown) => typeof m === "string"),
      )
      .map((post) => ({
        _id: post._id,
        medias: post.medias as unknown[],
      }))

    return {
      posts: postsToMigrate,
      cursor: paginationResult.isDone
        ? null
        : paginationResult.continueCursor,
      hasMore: !paginationResult.isDone,
    }
  },
})

/** Internal: migrate a batch of posts */
export const _migrateBatch = internalMutation({
  args: {
    postIds: v.array(v.id("posts")),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    details: v.array(
      v.object({
        postId: v.id("posts"),
        status: v.union(
          v.literal("migrated"),
          v.literal("skipped"),
          v.literal("not_found"),
        ),
        mediaCount: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    let migrated = 0
    let skipped = 0
    const details: Array<{
      postId: Id<"posts">
      status: "migrated" | "skipped" | "not_found"
      mediaCount: number
    }> = []

    for (const postId of args.postIds) {
      const post = await ctx.db.get(postId)
      if (!post) {
        skipped++
        details.push({ postId, status: "not_found", mediaCount: 0 })
        continue
      }

      const hasOldFormat = post.medias?.some((m: unknown) => typeof m === "string")
      if (!hasOldFormat) {
        skipped++
        details.push({
          postId,
          status: "skipped",
          mediaCount: post.medias?.length || 0,
        })
        continue
      }

      const normalizedMedias = (post.medias || []).map(normalizeMedia)
      await ctx.db.patch(postId, { medias: normalizedMedias })
      migrated++
      details.push({
        postId,
        status: "migrated",
        mediaCount: normalizedMedias.length,
      })
    }

    return { migrated, skipped, details }
  },
})

type BatchResult = {
  posts: Array<{ _id: Id<"posts">; medias: unknown[] }>
  cursor: string | null
  hasMore: boolean
}

/**
 * Lance la migration complète. Visible dans le dashboard.
 * Retourne un rapport détaillé de ce qui a été fait.
 */
export const run = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    totalPostsScanned: v.number(),
    totalMigrated: v.number(),
    totalSkipped: v.number(),
    totalBatches: v.number(),
    batchDetails: v.array(
      v.object({
        batchNumber: v.number(),
        migrated: v.number(),
        skipped: v.number(),
        postIds: v.array(v.string()),
      }),
    ),
  }),
  handler: async (ctx) => {
    let cursor: string | undefined = undefined
    let totalMigrated = 0
    let totalSkipped = 0
    let totalBatches = 0
    let totalPostsScanned = 0
    const batchDetails: Array<{
      batchNumber: number
      migrated: number
      skipped: number
      postIds: string[]
    }> = []

    while (true) {
      const result: BatchResult = await ctx.runQuery(
        internal.migrations.migratePostMedias._getPostsToMigrate,
        { cursor },
      )

      totalPostsScanned += BATCH_SIZE // approximation par page

      if (result.posts.length > 0) {
        const postIds = result.posts.map(
          (p: { _id: Id<"posts"> }) => p._id,
        )
        const batchResult = await ctx.runMutation(
          internal.migrations.migratePostMedias._migrateBatch,
          { postIds },
        )

        totalMigrated += batchResult.migrated
        totalSkipped += batchResult.skipped
        totalBatches++

        batchDetails.push({
          batchNumber: totalBatches,
          migrated: batchResult.migrated,
          skipped: batchResult.skipped,
          postIds: postIds.map(String),
        })

        console.log(
          `Batch ${totalBatches}: migrated=${batchResult.migrated}, skipped=${batchResult.skipped}`,
        )
      }

      if (!result.hasMore || !result.cursor) break
      cursor = result.cursor
    }

    console.log(
      `Migration complete: totalMigrated=${totalMigrated}, totalSkipped=${totalSkipped}, batches=${totalBatches}`,
    )

    return {
      success: true,
      totalPostsScanned,
      totalMigrated,
      totalSkipped,
      totalBatches,
      batchDetails,
    }
  },
})

// ============================================================================
// 4. VERIFY MIGRATION (query — vérifie l'intégrité post-migration)
// ============================================================================

/**
 * Vérifie que tous les posts sont correctement migrés.
 * Détecte les anomalies : médias sans URL, sans type, format inconnu, etc.
 */
export const verifyMigration = query({
  args: {},
  returns: v.object({
    totalPosts: v.number(),
    totalWithMedia: v.number(),
    allMigrated: v.boolean(),
    anomalies: v.array(
      v.object({
        postId: v.id("posts"),
        issue: v.string(),
        mediaIndex: v.number(),
        mediaValue: v.any(),
      }),
    ),
    formatBreakdown: v.object({
      oldStringFormat: v.number(),
      newObjectFormat: v.number(),
      unknownFormat: v.number(),
    }),
    typeBreakdown: v.object({
      images: v.number(),
      videos: v.number(),
    }),
    mediasWithMissingFields: v.array(
      v.object({
        postId: v.id("posts"),
        mediaIndex: v.number(),
        missingFields: v.array(v.string()),
      }),
    ),
  }),
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect()
    const postsWithMedia = posts.filter(
      (p) => p.medias && p.medias.length > 0,
    )

    let oldStringFormat = 0
    let newObjectFormat = 0
    let unknownFormat = 0
    let images = 0
    let videos = 0

    const anomalies: Array<{
      postId: Id<"posts">
      issue: string
      mediaIndex: number
      mediaValue: unknown
    }> = []

    const mediasWithMissingFields: Array<{
      postId: Id<"posts">
      mediaIndex: number
      missingFields: string[]
    }> = []

    for (const post of postsWithMedia) {
      for (let i = 0; i < post.medias.length; i++) {
        const m = post.medias[i]

        if (typeof m === "string") {
          oldStringFormat++
          anomalies.push({
            postId: post._id,
            issue: "Ancien format string non migré",
            mediaIndex: i,
            mediaValue: m,
          })
        } else if (isNewFormat(m)) {
          newObjectFormat++
          const obj = m as Record<string, unknown>

          // Type check
          if (obj.type === "image") images++
          else if (obj.type === "video") videos++

          // Check required fields
          const missing: string[] = []
          if (!obj.url) missing.push("url")
          if (!obj.mediaId) missing.push("mediaId")
          if (!obj.mimeType) missing.push("mimeType")
          if (!obj.type) missing.push("type")

          if (missing.length > 0) {
            mediasWithMissingFields.push({
              postId: post._id,
              mediaIndex: i,
              missingFields: missing,
            })
          }

          // URL validation
          if (typeof obj.url === "string") {
            if (
              !obj.url.startsWith("https://") &&
              !obj.url.startsWith("http://")
            ) {
              anomalies.push({
                postId: post._id,
                issue: `URL invalide (ne commence pas par https://)`,
                mediaIndex: i,
                mediaValue: obj.url,
              })
            }
          }
        } else {
          unknownFormat++
          anomalies.push({
            postId: post._id,
            issue: "Format inconnu (ni string, ni PostMedia valide)",
            mediaIndex: i,
            mediaValue: m,
          })
        }
      }
    }

    return {
      totalPosts: posts.length,
      totalWithMedia: postsWithMedia.length,
      allMigrated: oldStringFormat === 0 && unknownFormat === 0,
      anomalies: anomalies.slice(0, 50), // Limiter à 50 pour éviter les gros payloads
      formatBreakdown: {
        oldStringFormat,
        newObjectFormat,
        unknownFormat,
      },
      typeBreakdown: {
        images,
        videos,
      },
      mediasWithMissingFields: mediasWithMissingFields.slice(0, 50),
    }
  },
})

// ============================================================================
// 5. SAMPLE MIGRATED POSTS (query — échantillon pour vérif manuelle)
// ============================================================================

/**
 * Retourne un échantillon de posts déjà migrés pour vérification manuelle.
 * Montre le contenu complet des médias pour s'assurer que tout est correct.
 */
export const sampleMigratedPosts = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      postId: v.id("posts"),
      author: v.id("users"),
      createdAt: v.number(),
      content: v.string(),
      visibility: v.string(),
      medias: v.array(v.any()),
      mediaSummary: v.object({
        count: v.number(),
        types: v.array(v.string()),
        allNewFormat: v.boolean(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20
    const posts = await ctx.db.query("posts").order("desc").take(200)

    // Prendre un échantillon de posts avec médias
    const postsWithMedia = posts.filter(
      (p) => p.medias && p.medias.length > 0,
    )

    return postsWithMedia.slice(0, limit).map((post) => {
      const medias = post.medias || []
      const types = medias
        .map((m: unknown) => {
          if (typeof m === "string") return "string"
          if (isNewFormat(m)) return (m as { type: string }).type
          return "unknown"
        })
      const allNewFormat = medias.every(isNewFormat)

      return {
        postId: post._id,
        author: post.author,
        createdAt: post._creationTime,
        content:
          post.content.length > 100
            ? post.content.substring(0, 100) + "..."
            : post.content,
        visibility: post.visibility || "public",
        medias: medias as unknown[],
        mediaSummary: {
          count: medias.length,
          types: [...new Set(types)],
          allNewFormat,
        },
      }
    })
  },
})
