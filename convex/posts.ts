import { ConvexError, v } from "convex/values"
import { api } from "./_generated/api"
import { mutation, query } from "./_generated/server"

export const createPost = mutation({
  args: {
    content: v.string(),
    medias: v.array(v.string()),
    visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()
    if (!user) throw new ConvexError("User not found")

    const postId = await ctx.db.insert("posts", {
      author: user._id,
      content: args.content,
      medias: args.medias,
      visibility: args.visibility,
    })

    // Récupération des abonnés avec statuts active ou expired
    const allSubs = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_type", (q) =>
        q.eq("creator", user._id).eq("type", "content_access"),
      )
      .collect()

    const relevantSubs = allSubs.filter(
      (s) => s.status === "active" || s.status === "expired",
    )

    if (relevantSubs.length === 0) {
      return { postId }
    }

    // Déduplication des subscribers & exclusion de soi
    const followerIds = [
      ...new Set(
        relevantSubs
          .map((s) => s.subscriber)
          .filter((subscriberId) => subscriberId !== user._id),
      ),
    ]

    if (followerIds.length === 0) {
      return { postId }
    }

    // Exclure relations de blocage (auteur a bloqué / est bloqué)
    const blockedByAuthor = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", user._id))
      .collect()
    const blockingAuthor = await ctx.db
      .query("blocks")
      .withIndex("by_blocked", (q) => q.eq("blockedId", user._id))
      .collect()

    const blockedSet = new Set([
      ...blockedByAuthor.map((b) => b.blockedId),
      ...blockingAuthor.map((b) => b.blockerId),
    ])

    const finalRecipientIds = followerIds.filter((id) => !blockedSet.has(id))

    if (finalRecipientIds.length === 0) {
      return { postId }
    }

    // Seuil pour fan-out différé si volumineux
    const FANOUT_THRESHOLD = 200
    if (finalRecipientIds.length > FANOUT_THRESHOLD) {
      // Action interne fanoutNewPostNotifications pour batcher
      await ctx.scheduler.runAfter(
        0,
        api.internalActions?.fanoutNewPostNotifications,
        {
          authorId: user._id,
          postId,
          recipientIds: finalRecipientIds,
        },
      )
      return { postId, deferred: true }
    }

    // Insertion parallèle contrôlée, suffisant tant que volume raisonnable
    await Promise.all(
      finalRecipientIds.map((recipientId) =>
        ctx.db
          .insert("notifications", {
            type: "newPost",
            recipientId,
            sender: user._id,
            post: postId,
            read: false,
          })
          .catch((err) => {
            console.error("Notification insert failed", {
              postId,
              recipientId,
              err,
            })
          }),
      ),
    )

    return { postId }
  },
})

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError("User not found")

    // Récupérer le post à supprimer
    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError("Post not found")

    if (post.author !== user._id && user.accountType !== "SUPERUSER") {
      throw new ConvexError("User not authorized to delete this post")
    }

    // Suppression des médias Cloudinary en parallèle
    if (post.medias && post.medias.length > 0) {
      const uniqueMedias = [...new Set(post.medias)]
      await Promise.all(
        uniqueMedias.map((mediaUrl) =>
          ctx.scheduler
            .runAfter(0, api.internalActions.deleteCloudinaryAssetFromUrl, {
              url: mediaUrl,
            })
            .catch((error) => {
              console.error(
                `Failed to schedule deletion for media ${mediaUrl}:`,
                error,
              )
            }),
        ),
      )
    }

    // Récupérations parallèles des entités associées (comments, likes, bookmarks, notifications)
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

    // Suppressions en parallèle contrôlée
    await Promise.all([
      ...comments.map((c) => ctx.db.delete(c._id)),
      ...likes.map((l) => ctx.db.delete(l._id)),
      ...bookmarks.map((b) => ctx.db.delete(b._id)),
      ...notifications.map((n) => ctx.db.delete(n._id)),
    ])

    // Suppression finale du post
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

export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_id", (q) => q.eq("_id", args.postId))
      .unique()

    if (!post) {
      console.error("Post not found for ID:", args.postId)
      return null
    }

    const author = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", post.author))
      .unique()

    if (!author) throw new ConvexError("Author not found")

    return {
      ...post,
      author,
    }
  },
})

export const getUserPosts = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId)
    if (!author) throw new ConvexError("User not found")

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("author", author._id))
      .order("desc")
      .collect()

    const postsWithAuthor = posts.map((post) => ({
      ...post,
      author,
    }))

    return postsWithAuthor
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

    // Filtrer les posts qui ont au moins un média
    const postsWithMedia = posts.filter(
      (post) => post.medias && post.medias.length > 0,
    )

    // Aplatir tous les médias en éléments individuels de galerie
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
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("posts").order("desc").take(100)

    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("_id"), post.author))
          .unique()

        return {
          ...post,
          author,
        }
      }),
    )

    return postsWithAuthor
  },
})

export const getHomePosts = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()
    if (!currentUser) throw new ConvexError("User not found")

    const POST_FETCH_LIMIT = 80

    // Cas SUPERUSER: lecture brute + enrichissement auteurs
    if (currentUser.accountType === "SUPERUSER") {
      const posts = await ctx.db
        .query("posts")
        .order("desc")
        .take(POST_FETCH_LIMIT)
      const authorIds = [...new Set(posts.map((p) => p.author))]
      const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
      const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))
      return posts.map((p) => ({
        ...p,
        author: authorsMap.get(p.author),
      }))
    }

    // Récupérer toutes les souscriptions de l'utilisateur (une seule requête)
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber_type", (q) =>
        q.eq("subscriber", currentUser._id).eq("type", "content_access"),
      )
      .collect()

    const activeCreatorIds = new Set(
      subs.filter((s) => s.status === "active").map((s) => s.creator),
    )

    // Récupérer un lot de posts récents
    const rawPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(POST_FETCH_LIMIT)

    // Filtrage visibilité
    const filtered = rawPosts.filter((post) => {
      if (!post.visibility || post.visibility === "public") return true
      if (post.visibility === "subscribers_only") {
        if (post.author === currentUser._id) return true
        if (activeCreatorIds.has(post.author)) return true
      }
      return false
    })

    // Enrichissement auteurs (batch)
    const authorIds = [...new Set(filtered.map((p) => p.author))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    return filtered.map((p) => ({
      ...p,
      author: authorsMap.get(p.author),
    }))
  },
})

export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()
    if (!user) throw new ConvexError("User not found")

    // Récupérer le post
    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError("Post not found")

    // Vérifier que l'utilisateur est bien l'auteur
    if (post.author !== user._id) throw new ConvexError("Unauthorized")

    // Mettre à jour le contenu du post
    await ctx.db.patch(args.postId, {
      content: args.content,
    })

    return { success: true }
  },
})

export const updatePostVisibility = mutation({
  args: {
    postId: v.id("posts"),
    visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new Error("User not found")

    // Récupérer le post
    const post = await ctx.db.get(args.postId)
    if (!post) throw new Error("Post not found")

    // Vérifier que l'utilisateur est bien l'auteur
    if (post.author !== user._id) throw new Error("Unauthorized")

    // Mettre à jour la visibilité du post
    await ctx.db.patch(args.postId, {
      visibility: args.visibility,
    })

    return { success: true }
  },
})
