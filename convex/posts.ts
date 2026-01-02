/**
 * Posts - Mutations et Queries refactorés
 * Utilise les helpers de convex/lib pour réduire la duplication
 */
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { api } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import {
  createAppError,
  filterBlockedUsers,
  getActiveSubscribedCreatorIds,
  getAuthenticatedUser,
  getBlockedUserIds,
  getCreatorSubscribers,
} from "./lib"
import { sendPostNotifications } from "./notificationQueue"

// ============================================================================
// MUTATIONS
// ============================================================================

export const createPost = mutation({
  args: {
    content: v.string(),
    medias: v.array(v.string()),
    visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
    isAdult: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const postId = await ctx.db.insert("posts", {
      author: user._id,
      content: args.content,
      medias: args.medias,
      visibility: args.visibility,
      isAdult: args.isAdult ?? false,
    })

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
      const uniqueMedias = [...new Set(post.medias)]
      await ctx.scheduler
        .runAfter(0, api.internalActions.deleteMultipleBunnyAssets, {
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
        .withIndex("by_post", (q) => q.eq("post", args.postId))
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
      v.union(v.literal("public"), v.literal("subscribers_only"))
    ),
    isAdult: v.optional(v.boolean()),
  },
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
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) return null

    const author = await ctx.db.get(post.author)
    if (!author) throw createAppError("USER_NOT_FOUND")

    return { ...post, author }
  },
})

export const getUserPosts = query({
  args: {
    authorId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId)
    if (!author) throw createAppError("USER_NOT_FOUND")

    const paginationResult = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", author._id))
      .order("desc")
      .paginate(args.paginationOpts)

    return {
      ...paginationResult,
      page: paginationResult.page.map((post) => ({ ...post, author })),
    }
  },
})

// Get user posts with pinned posts first (for profile display)
export const getUserPostsWithPinned = query({
  args: {
    authorId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId)
    if (!author) throw createAppError("USER_NOT_FOUND")

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
        pinnedPostIds.map((id) => ctx.db.get(id))
      )
      const validPinnedPosts = pinnedPosts
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((post) => ({ ...post, author, isPinned: true as const }))

      // Filter out pinned posts from regular posts to avoid duplicates
      const regularPosts = paginationResult.page
        .filter((post) => !pinnedPostIds.includes(post._id))
        .map((post) => ({ ...post, author, isPinned: false as const }))

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
        .map((post) => ({ ...post, author, isPinned: false as const })),
    }
  },
})

export const getUserGallery = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", args.authorId))
      .order("desc")
      .collect()

    const postsWithMedia = posts.filter(
      (post) => post.medias && post.medias.length > 0,
    )

    const galleryItems: Array<{
      _id: string
      mediaUrl: string
      visibility: string
    }> = []

    postsWithMedia.forEach((post) => {
      post.medias?.forEach((mediaUrl, index) => {
        galleryItems.push({
          _id: `${post._id}_${index}`,
          mediaUrl,
          visibility: post.visibility || "public",
        })
      })
    })

    return galleryItems
  },
})

export const getAllPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").take(100)

    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.author)
        return { ...post, author }
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
      page: filtered.map((p) => ({ ...p, author: authorsMap.get(p.author) })),
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
      page: filtered.map((p) => ({ ...p, author: authorsMap.get(p.author) })),
    }
  },
})
