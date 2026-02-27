/**
 * Posts - Mutations et Queries refactorés
 * Utilise les helpers de convex/lib pour réduire la duplication
 */
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import {
  createAppError,
  filterBlockedUsers,
  filterPostMediasForViewer,
  getActiveSubscribedCreatorIds,
  getAuthenticatedUser,
  getBlockedUserIds,
  getCreatorSubscribers,
  hasActiveSubscription,
  postMediaValidator,
  userDocValidator,
} from "./lib"
import { rateLimiter } from "./lib/rateLimiter"
import { sendPostNotifications } from "./notificationQueue"
import { incrementUserStat } from "./userStats"

// ============================================================================
// MUTATIONS
// ============================================================================

export const createPost = mutation({
  args: {
    content: v.string(),
    medias: v.array(postMediaValidator),
    visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
    isAdult: v.optional(v.boolean()),
  },
  returns: v.object({
    postId: v.id("posts"),
    notificationsSent: v.optional(v.number()),
    deferred: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    await rateLimiter.limit(ctx, "createPost", { key: user._id, throws: true })

    if (args.content.length > 5000) {
      throw createAppError("INVALID_INPUT", {
        userMessage: "Le contenu est trop long (max 5000 caractères)",
      })
    }

    // Validate media constraints: max 3 medias, no mix images/videos
    if (args.medias.length > 3) {
      throw createAppError("INVALID_INPUT", {
        userMessage: "Maximum 3 médias par publication",
      })
    }
    if (args.medias.length > 0) {
      const hasImages = args.medias.some((m) => m.type === "image")
      const hasVideos = args.medias.some((m) => m.type === "video")
      if (hasImages && hasVideos) {
        throw createAppError("INVALID_INPUT", {
          userMessage: "Impossible de mixer images et vidéos dans un même post",
        })
      }
      if (hasVideos && args.medias.length > 1) {
        throw createAppError("INVALID_INPUT", {
          userMessage: "1 seule vidéo par publication",
        })
      }
    }

    const postId = await ctx.db.insert("posts", {
      author: user._id,
      content: args.content,
      medias: args.medias,
      visibility: args.visibility,
      isAdult: args.isAdult ?? false,
    })

    // Mise à jour incrémentale des stats du créateur
    await incrementUserStat(ctx, user._id, { postsCount: 1 })

    // Récupération des abonnés (actifs + expirés pour les notifier)
    const followerIds = await getCreatorSubscribers(ctx, user._id, [
      "active",
      "expired",
    ])

    if (followerIds.length === 0) {
      return { postId }
    }

    // Filtrer les utilisateurs bloqués
    const finalRecipientIds = await filterBlockedUsers(
      ctx,
      user._id,
      followerIds,
    )

    if (finalRecipientIds.length === 0) {
      return { postId }
    }

    // Envoi des notifications (direct ou via queue selon le volume)
    const { direct, count } = await sendPostNotifications(ctx, {
      sender: user._id,
      postId,
      recipientIds: finalRecipientIds,
    })

    return { postId, notificationsSent: count, deferred: !direct }
  },
})

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  returns: v.object({
    success: v.boolean(),
    deleted: v.object({
      comments: v.number(),
      likes: v.number(),
      bookmarks: v.number(),
      notifications: v.number(),
      medias: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const post = await ctx.db.get(args.postId)
    if (!post) throw createAppError("POST_NOT_FOUND")

    if (post.author !== user._id && user.accountType !== "SUPERUSER") {
      throw createAppError("UNAUTHORIZED", {
        context: { postId: args.postId, userId: user._id },
      })
    }

    // Suppression des médias Bunny.net en parallèle
    if (post.medias && post.medias.length > 0) {
      const mediaUrls = post.medias.map((m) => m.url)
      const uniqueMedias = [...new Set(mediaUrls)]
      await ctx.scheduler
        .runAfter(0, internal.internalActions.deleteMultipleBunnyAssets, {
          mediaUrls: uniqueMedias,
        })
        .catch((error) => {
          console.error(
            `Failed to schedule Bunny assets deletion for post ${args.postId}:`,
            error,
          )
        })
    }

    // Récupérations parallèles des entités associées
    const [comments, likes, bookmarks, notifications] = await Promise.all([
      ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("post", args.postId))
        .collect(),
      ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect(),
      ctx.db
        .query("bookmarks")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect(),
      ctx.db
        .query("notifications")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect(),
    ])

    // Suppressions en parallèle
    await Promise.all([
      ...comments.map((c) => ctx.db.delete(c._id)),
      ...likes.map((l) => ctx.db.delete(l._id)),
      ...bookmarks.map((b) => ctx.db.delete(b._id)),
      ...notifications.map((n) => ctx.db.delete(n._id)),
    ])

    await ctx.db.delete(args.postId)

    // Mise à jour incrémentale des stats du créateur
    // Décrémenter postsCount de 1 et totalLikes du nombre de likes supprimés
    await incrementUserStat(ctx, post.author, {
      postsCount: -1,
      totalLikes: -likes.length,
    })

    return {
      success: true,
      deleted: {
        comments: comments.length,
        likes: likes.length,
        bookmarks: bookmarks.length,
        notifications: notifications.length,
        medias: post.medias?.length || 0,
      },
    }
  },
})

export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    content: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("subscribers_only")),
    ),
    isAdult: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const post = await ctx.db.get(args.postId)
    if (!post) throw createAppError("POST_NOT_FOUND")

    const isOwner = post.author === user._id
    const isSuperuser = user.accountType === "SUPERUSER"

    // Neither owner nor superuser
    if (!isOwner && !isSuperuser) {
      throw createAppError("UNAUTHORIZED")
    }

    // Superuser can only modify isAdult
    if (isSuperuser && !isOwner) {
      if (args.content !== undefined || args.visibility !== undefined) {
        throw createAppError("UNAUTHORIZED", {
          context: { message: "Admins can only modify adult content status" },
        })
      }
      if (args.isAdult !== undefined) {
        await ctx.db.patch(args.postId, { isAdult: args.isAdult })
      }
      return { success: true }
    }

    if (args.content !== undefined && args.content.length > 5000) {
      throw createAppError("INVALID_INPUT", {
        userMessage: "Le contenu est trop long (max 5000 caractères)",
      })
    }

    // Owner can modify everything
    const updates: Partial<{
      content: string
      visibility: "public" | "subscribers_only"
      isAdult: boolean
    }> = {}

    if (args.content !== undefined) updates.content = args.content
    if (args.visibility !== undefined) updates.visibility = args.visibility
    if (args.isAdult !== undefined) updates.isAdult = args.isAdult

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.postId, updates)
    }

    return { success: true }
  },
})

// ============================================================================
// QUERIES
// ============================================================================

export const getPost = query({
  args: { postId: v.id("posts") },
  returns: v.union(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      author: userDocValidator,
      content: v.string(),
      medias: v.array(postMediaValidator),
      visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
      isAdult: v.optional(v.boolean()),
      isMediaLocked: v.boolean(),
      mediaCount: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) return null

    const author = await ctx.db.get(post.author)
    if (!author) throw createAppError("USER_NOT_FOUND")

    // Filtrer les médias selon les droits d'accès
    const currentUser = await getAuthenticatedUser(ctx, { optional: true })
    const { medias, isMediaLocked, mediaCount } =
      await filterPostMediasForViewer(
        ctx,
        post,
        currentUser?._id ?? null,
        currentUser?.accountType,
      )

    return { ...post, medias: medias || [], isMediaLocked, mediaCount, author }
  },
})

export const getUserPosts = query({
  args: {
    authorId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  }),
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId)
    if (!author) throw createAppError("USER_NOT_FOUND")

    // Déterminer les droits d'accès une fois
    const currentUser = await getAuthenticatedUser(ctx, { optional: true })
    let canViewSubscribersOnly = false
    if (currentUser) {
      canViewSubscribersOnly =
        currentUser._id === args.authorId ||
        currentUser.accountType === "SUPERUSER" ||
        (await hasActiveSubscription(
          ctx,
          currentUser._id,
          args.authorId,
          "content_access",
        ))
    }

    const paginationResult = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", author._id))
      .order("desc")
      .paginate(args.paginationOpts)

    // Filtrer les médias de chaque post et normaliser
    const postsWithFilteredMedia = paginationResult.page.map((post) => {
      const originalMediaCount = post.medias?.length || 0
      const isLocked =
        post.visibility === "subscribers_only" && !canViewSubscribersOnly

      return {
        ...post,
        medias: isLocked ? [] : post.medias || [],
        isMediaLocked: isLocked && originalMediaCount > 0,
        mediaCount: originalMediaCount,
        author,
      }
    })

    return {
      ...paginationResult,
      page: postsWithFilteredMedia,
    }
  },
})

// Get user posts with pinned posts first (for profile display)
export const getUserPostsWithPinned = query({
  args: {
    authorId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  }),
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId)
    if (!author) throw createAppError("USER_NOT_FOUND")

    // Déterminer les droits d'accès une fois
    const currentUser = await getAuthenticatedUser(ctx, { optional: true })
    let canViewSubscribersOnly = false
    if (currentUser) {
      canViewSubscribersOnly =
        currentUser._id === args.authorId ||
        currentUser.accountType === "SUPERUSER" ||
        (await hasActiveSubscription(
          ctx,
          currentUser._id,
          args.authorId,
          "content_access",
        ))
    }

    // Helper pour filtrer les médias d'un post et normaliser
    const filterPostMedia = <
      T extends { medias?: Array<{ type: string; url: string }>; visibility?: string },
    >(
      post: T,
      isPinned: boolean,
    ) => {
      const originalMediaCount = post.medias?.length || 0
      const isLocked =
        post.visibility === "subscribers_only" && !canViewSubscribersOnly

      return {
        ...post,
        medias: isLocked ? [] : post.medias || [],
        isMediaLocked: isLocked && originalMediaCount > 0,
        mediaCount: originalMediaCount,
        author,
        isPinned: isPinned as typeof isPinned,
      }
    }

    const pinnedPostIds = author.pinnedPostIds || []
    const isFirstPage = !args.paginationOpts.cursor

    // Fetch regular posts with pagination
    const paginationResult = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", author._id))
      .order("desc")
      .paginate(args.paginationOpts)

    if (isFirstPage && pinnedPostIds.length > 0) {
      // Fetch pinned posts in order (maintains pinnedPostIds order)
      const pinnedPosts = await Promise.all(
        pinnedPostIds.map((id) => ctx.db.get(id)),
      )
      const validPinnedPosts = pinnedPosts
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((post) => filterPostMedia(post, true))

      // Filter out pinned posts from regular posts to avoid duplicates
      const regularPosts = paginationResult.page
        .filter((post) => !pinnedPostIds.includes(post._id))
        .map((post) => filterPostMedia(post, false))

      return {
        ...paginationResult,
        page: [...validPinnedPosts, ...regularPosts],
      }
    }

    // Subsequent pages - exclude pinned posts (already shown on first page)
    return {
      ...paginationResult,
      page: paginationResult.page
        .filter((post) => !pinnedPostIds.includes(post._id))
        .map((post) => filterPostMedia(post, false)),
    }
  },
})

export const getUserGallery = query({
  args: {
    authorId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.string(),
    media: postMediaValidator,
    visibility: v.string(),
  })),
  handler: async (ctx, args) => {
    // Déterminer les droits d'accès une fois
    const currentUser = await getAuthenticatedUser(ctx, { optional: true })
    let canViewSubscribersOnly = false
    if (currentUser) {
      canViewSubscribersOnly =
        currentUser._id === args.authorId ||
        currentUser.accountType === "SUPERUSER" ||
        (await hasActiveSubscription(
          ctx,
          currentUser._id,
          args.authorId,
          "content_access",
        ))
    }

    // Limite par défaut de 100 posts pour éviter les full table scans
    const limit = args.limit ?? 100
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", args.authorId))
      .order("desc")
      .take(limit)

    const postsWithMedia = posts.filter(
      (post) => post.medias && post.medias.length > 0,
    )

    const galleryItems: Array<{
      _id: string
      media: { type: "image" | "video"; url: string; mediaId: string; mimeType: string; fileName?: string; fileSize?: number; thumbnailUrl?: string; duration?: number; width?: number; height?: number }
      visibility: string
    }> = []

    // Ne retourner que les médias accessibles
    postsWithMedia.forEach((post) => {
      const isLocked =
        post.visibility === "subscribers_only" && !canViewSubscribersOnly

      // Ne pas inclure les médias verrouillés dans la galerie
      if (!isLocked) {
        post.medias?.forEach((m, index) => {
          galleryItems.push({
            _id: `${post._id}_${index}`,
            media: m,
            visibility: post.visibility || "public",
          })
        })
      }
    })

    return galleryItems
  },
})

export const getAllPosts = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("posts"),
    _creationTime: v.number(),
    author: v.union(v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      username: v.optional(v.string()),
      email: v.string(),
      image: v.string(),
      imageBanner: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      socialLinks: v.optional(v.any()),
      pinnedPostIds: v.optional(v.array(v.id("posts"))),
      isOnline: v.boolean(),
      activeSessions: v.optional(v.number()),
      lastSeenAt: v.optional(v.number()),
      tokenIdentifier: v.string(),
      externalId: v.optional(v.string()),
      accountType: v.union(v.literal("USER"), v.literal("CREATOR"), v.literal("SUPERUSER")),
      allowAdultContent: v.optional(v.boolean()),
      personalInfo: v.optional(v.any()),
      isBanned: v.optional(v.boolean()),
      banDetails: v.optional(v.any()),
      banHistory: v.optional(v.any()),
      badges: v.optional(v.any()),
    }), v.null()),
    content: v.string(),
    medias: v.array(postMediaValidator),
    visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
    isAdult: v.optional(v.boolean()),
  })),
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").take(100)

    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.author)
        return {
          ...post,
          medias: post.medias || [],
          author,
        }
      }),
    )

    return postsWithAuthor
  },
})

/**
 * Query principale du feed - Compatible avec usePaginatedQuery
 * Filtre automatiquement : blocages, visibilité (subscribers_only)
 */
export const getHomePosts = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  }),
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    // Récupérer les créateurs auxquels l'utilisateur est abonné
    const activeCreatorIds = await getActiveSubscribedCreatorIds(
      ctx,
      currentUser._id,
      "content_access",
    )

    // Récupérer les IDs bloqués
    const blockedUserIds = await getBlockedUserIds(ctx, currentUser._id)
    const allowAdultContent = currentUser.allowAdultContent ?? false

    // Pagination native Convex
    const paginationResult = await ctx.db
      .query("posts")
      .order("desc")
      .paginate(args.paginationOpts)

    // Filtrage visibilité, blocage et contenu adulte
    const filtered = paginationResult.page.filter((post) => {
      // SUPERUSER voit tout
      if (currentUser.accountType === "SUPERUSER") return true

      // Filtrer les auteurs bloqués
      if (blockedUserIds.has(post.author)) return false

      const isPostAdult = post.isAdult ?? false

      // Filtrage du contenu adulte
      if (isPostAdult) {
        // Créateur voit toujours son propre contenu +18
        if (post.author === currentUser._id) return true

        // Post +18 subscribers_only : abonnement suffit
        if (post.visibility === "subscribers_only") {
          return activeCreatorIds.has(post.author)
        }

        // Post +18 public : nécessite allowAdultContent activé
        if (post.visibility === "public") {
          return allowAdultContent
        }

        return false
      }

      // Contenu non-adulte : logique existante
      if (!post.visibility || post.visibility === "public") return true
      if (post.visibility === "subscribers_only") {
        if (post.author === currentUser._id) return true
        if (activeCreatorIds.has(post.author)) return true
      }

      return false
    })

    // Enrichissement auteurs (batch optimisé)
    const authorIds = [...new Set(filtered.map((p) => p.author))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    return {
      ...paginationResult,
      page: filtered.map((p) => ({
        ...p,
        medias: p.medias || [],
        author: authorsMap.get(p.author),
      })),
    }
  },
})

/**
 * Query compatible avec usePaginatedQuery de convex/react
 * Retourne directement les posts (pas l'objet { page, continueCursor, isDone })
 */
export const getHomePostsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  }),
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    const activeCreatorIds = await getActiveSubscribedCreatorIds(
      ctx,
      currentUser._id,
      "content_access",
    )

    const blockedUserIds = await getBlockedUserIds(ctx, currentUser._id)
    const allowAdultContent = currentUser.allowAdultContent ?? false

    const paginationResult = await ctx.db
      .query("posts")
      .order("desc")
      .paginate(args.paginationOpts)

    const filtered = paginationResult.page.filter((post) => {
      // SUPERUSER voit tout
      if (currentUser.accountType === "SUPERUSER") return true

      // Filtrer les auteurs bloqués
      if (blockedUserIds.has(post.author)) return false

      const isPostAdult = post.isAdult ?? false

      // Filtrage du contenu adulte
      if (isPostAdult) {
        // Créateur voit toujours son propre contenu +18
        if (post.author === currentUser._id) return true

        // Post +18 subscribers_only : abonnement suffit
        if (post.visibility === "subscribers_only") {
          return activeCreatorIds.has(post.author)
        }

        // Post +18 public : nécessite allowAdultContent activé
        if (post.visibility === "public") {
          return allowAdultContent
        }

        return false
      }

      // Contenu non-adulte : logique existante
      if (!post.visibility || post.visibility === "public") return true
      if (post.visibility === "subscribers_only") {
        if (post.author === currentUser._id) return true
        if (activeCreatorIds.has(post.author)) return true
      }
      return false
    })

    const authorIds = [...new Set(filtered.map((p) => p.author))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    return {
      ...paginationResult,
      page: filtered.map((p) => ({
        ...p,
        medias: p.medias || [],
        author: authorsMap.get(p.author),
      })),
    }
  },
})
