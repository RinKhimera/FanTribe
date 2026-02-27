import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    name: v.string(),
    username: v.optional(v.string()),
    email: v.string(),
    image: v.string(),
    imageBanner: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    socialLinks: v.optional(
      v.array(
        v.object({
          platform: v.union(
            v.literal("twitter"),
            v.literal("instagram"),
            v.literal("tiktok"),
            v.literal("youtube"),
            v.literal("linkedin"),
            v.literal("snapchat"),
            v.literal("facebook"),
            v.literal("website"),
            v.literal("other"),
          ),
          url: v.string(),
          username: v.optional(v.string()),
        }),
      ),
    ),
    pinnedPostIds: v.optional(v.array(v.id("posts"))),
    isOnline: v.boolean(),
    activeSessions: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
    tokenIdentifier: v.string(),
    externalId: v.optional(v.string()),
    accountType: v.union(
      v.literal("USER"),
      v.literal("CREATOR"),
      v.literal("SUPERUSER"),
    ),
    allowAdultContent: v.optional(v.boolean()),
    personalInfo: v.optional(
      v.object({
        fullName: v.optional(v.string()),
        dateOfBirth: v.optional(v.string()),
        address: v.optional(v.string()),
        whatsappNumber: v.optional(v.string()),
        mobileMoneyNumber: v.optional(v.string()),
        mobileMoneyNumber2: v.optional(v.string()),
      }),
    ),
    // Notification preferences
    notificationPreferences: v.optional(
      v.object({
        likes: v.optional(v.boolean()),
        comments: v.optional(v.boolean()),
        newPosts: v.optional(v.boolean()),
        subscriptions: v.optional(v.boolean()),
        follows: v.optional(v.boolean()),
        messages: v.optional(v.boolean()),
        tips: v.optional(v.boolean()),
        emailNotifications: v.optional(v.boolean()),
      }),
    ),
    // Privacy & security settings
    // TODO: A implementer au frontend
    privacySettings: v.optional(
      v.object({
        profileVisibility: v.optional(
          v.union(v.literal("public"), v.literal("private")),
        ),
        allowMessagesFromNonSubscribers: v.optional(v.boolean()),
        language: v.optional(v.string()),
      }),
    ),
    isBanned: v.optional(v.boolean()),
    banDetails: v.optional(
      v.object({
        type: v.union(v.literal("temporary"), v.literal("permanent")),
        reason: v.string(),
        bannedAt: v.number(),
        bannedBy: v.id("users"),
        expiresAt: v.optional(v.number()),
      }),
    ),
    banHistory: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("temporary"), v.literal("permanent")),
          reason: v.string(),
          bannedAt: v.number(),
          bannedBy: v.id("users"),
          expiresAt: v.optional(v.number()),
          liftedAt: v.optional(v.number()),
          liftedBy: v.optional(v.id("users")),
        }),
      ),
    ),
    badges: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("verified"),
            v.literal("top_creator"),
            v.literal("founding_member"),
            v.literal("popular"),
            v.literal("rising_star"),
          ),
          awardedAt: v.number(),
        }),
      ),
    ),
    onboardingCompleted: v.optional(v.boolean()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_username", ["username"])
    .index("by_externalId", ["externalId"])
    .index("by_accountType", ["accountType"])
    .index("by_isOnline", ["isOnline"])
    .index("by_isOnline_lastSeenAt", ["isOnline", "lastSeenAt"])
    .index("by_isBanned", ["isBanned"])
    .searchIndex("search_users", {
      searchField: "name",
      filterFields: ["accountType", "username"],
    }),

  creatorApplications: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
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
    personalInfo: v.object({
      fullName: v.string(),
      dateOfBirth: v.string(),
      address: v.string(),
      whatsappNumber: v.optional(v.string()),
      mobileMoneyNumber: v.optional(v.string()),
      mobileMoneyNumber2: v.optional(v.string()),
    }),
    applicationReason: v.string(),
    adminNotes: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    attemptNumber: v.optional(v.number()),
    rejectionCount: v.optional(v.number()),
    previousRejectionReason: v.optional(v.string()),
    reapplicationAllowedAt: v.optional(v.number()),
    previousApplicationId: v.optional(v.id("creatorApplications")),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  posts: defineTable({
    author: v.id("users"),
    content: v.string(),
    medias: v.array(
      v.object({
        type: v.union(v.literal("image"), v.literal("video")),
        url: v.string(),
        mediaId: v.string(),
        mimeType: v.string(),
        fileName: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        thumbnailUrl: v.optional(v.string()),
        duration: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
      }),
    ),
    visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
    isAdult: v.optional(v.boolean()),
  })
    .index("by_author", ["author"])
    .index("by_visibility", ["visibility"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_user_post", ["userId", "postId"]),

  comments: defineTable({
    author: v.id("users"),
    post: v.id("posts"),
    content: v.string(),
  })
    .index("by_post", ["post"])
    .index("by_author", ["author"]),

  // ============================================
  // MESSAGERIE - Refonte complète
  // ============================================

  conversations: defineTable({
    // Participants (toujours 1:1 - pas de groupes)
    creatorId: v.id("users"), // Le CRÉATEUR
    userId: v.id("users"), // Le USER/abonné

    // Champs dénormalisés pour performance
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()), // 100 premiers chars
    lastMessageSenderId: v.optional(v.id("users")),

    // Compteurs non-lus dénormalisés
    unreadCountCreator: v.number(),
    unreadCountUser: v.number(),

    // État de verrouillage (quand abo messagerie expire)
    isLocked: v.boolean(),
    lockedAt: v.optional(v.number()),
    lockedReason: v.optional(
      v.union(v.literal("subscription_expired"), v.literal("admin_blocked")),
    ),

    // Préférences par participant
    mutedByCreator: v.optional(v.boolean()),
    mutedByUser: v.optional(v.boolean()),
    pinnedByCreator: v.optional(v.boolean()),
    pinnedByUser: v.optional(v.boolean()),

    // Soft delete
    deletedByCreator: v.optional(v.boolean()),
    deletedByUser: v.optional(v.boolean()),

    // Admin
    blockedByAdmin: v.optional(v.boolean()),
    blockedByAdminReason: v.optional(v.string()),

    // Tracking de l'initiateur de la conversation
    initiatedBy: v.optional(v.id("users")), // Qui a créé la conversation
    initiatorRole: v.optional(
      v.union(v.literal("admin"), v.literal("creator"), v.literal("user")),
    ), // Rôle au moment de la création
    requiresSubscription: v.optional(v.boolean()), // false si initié par admin (bypass check)
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_userId", ["userId"])
    .index("by_creatorId_lastMessageAt", ["creatorId", "lastMessageAt"])
    .index("by_userId_lastMessageAt", ["userId", "lastMessageAt"])
    .index("by_participants", ["creatorId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),

    // Contenu texte (optionnel si media-only)
    content: v.optional(v.string()),

    // Médias (array pour plusieurs pièces jointes)
    medias: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("image"),
            v.literal("video"),
            v.literal("audio"),
            v.literal("document"),
          ),
          url: v.string(),
          mediaId: v.string(), // Bunny CDN ID
          mimeType: v.string(),
          fileName: v.optional(v.string()),
          fileSize: v.optional(v.number()),
          thumbnailUrl: v.optional(v.string()),
          duration: v.optional(v.number()), // Pour audio/video
          width: v.optional(v.number()), // Pour images/video
          height: v.optional(v.number()),
        }),
      ),
    ),

    // Type de message
    messageType: v.union(
      v.literal("text"),
      v.literal("media"),
      v.literal("system"),
    ),

    // Sous-type pour messages système
    systemMessageType: v.optional(
      v.union(
        v.literal("conversation_started"),
        v.literal("subscription_expired"),
        v.literal("subscription_renewed"),
        v.literal("conversation_locked"),
        v.literal("conversation_unlocked"),
      ),
    ),

    // Réponse/Citation
    replyToMessageId: v.optional(v.id("messages")),

    // Réactions emoji (embedded pour éviter table séparée)
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userId: v.id("users"),
          createdAt: v.number(),
        }),
      ),
    ),

    // Édition
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    originalContent: v.optional(v.string()),

    // Soft delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),

    // Message envoyé pendant que la conversation était verrouillée (pour indicateur UI)
    sentWhileLocked: v.optional(v.boolean()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  // Indicateurs de frappe (données éphémères avec TTL)
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    startedAt: v.number(),
    expiresAt: v.number(), // Auto-expire après 5 secondes
  })
    .index("by_conversation", ["conversationId"])
    .index("by_expiresAt", ["expiresAt"]),

  subscriptions: defineTable({
    subscriber: v.id("users"),
    creator: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
    amountPaid: v.number(),
    currency: v.union(v.literal("XAF"), v.literal("USD")),
    renewalCount: v.number(),
    lastUpdateTime: v.number(),
    type: v.union(v.literal("content_access"), v.literal("messaging_access")),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("canceled"),
      v.literal("pending"),
    ),

    // Tracking de l'origine de l'abonnement
    grantedByCreator: v.optional(v.boolean()), // true si offert gratuitement par le créateur
    bundlePurchase: v.optional(v.boolean()), // true si acheté dans le bundle "Pack Complet"
  })
    .index("by_subscriber", ["subscriber"])
    .index("by_creator", ["creator"])
    .index("by_creator_subscriber", ["creator", "subscriber"])
    .index("by_status", ["status"])
    .index("by_creator_type", ["creator", "type"])
    .index("by_subscriber_type", ["subscriber", "type"])
    .index("by_subscriber_status", ["subscriber", "status"])
    .index("by_status_endDate", ["status", "endDate"]),

  transactions: defineTable({
    subscriptionId: v.id("subscriptions"),
    subscriberId: v.id("users"),
    creatorId: v.id("users"),
    amount: v.number(),
    currency: v.union(v.literal("XAF"), v.literal("USD")),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    provider: v.string(),
    providerTransactionId: v.string(),
  })
    .index("by_subscription", ["subscriptionId"])
    .index("by_subscriber", ["subscriberId"])
    .index("by_creator", ["creatorId"])
    .index("by_providerTransactionId", ["providerTransactionId"])
    .index("by_status", ["status"]),

  tips: defineTable({
    senderId: v.id("users"),
    creatorId: v.id("users"),
    amount: v.number(),
    currency: v.union(v.literal("XAF"), v.literal("USD")),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    provider: v.string(),
    providerTransactionId: v.string(),
    context: v.optional(
      v.union(v.literal("post"), v.literal("profile"), v.literal("message")),
    ),
    postId: v.optional(v.id("posts")),
    conversationId: v.optional(v.id("conversations")),
  })
    .index("by_creator", ["creatorId"])
    .index("by_sender", ["senderId"])
    .index("by_providerTransactionId", ["providerTransactionId"])
    .index("by_status", ["status"])
    .index("by_creator_status", ["creatorId", "status"]),

  notifications: defineTable({
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("newPost"),
      v.literal("newSubscription"),
      v.literal("renewSubscription"),
      v.literal("subscriptionExpired"),
      v.literal("subscriptionConfirmed"),
      v.literal("creatorApplicationApproved"),
      v.literal("creatorApplicationRejected"),
      v.literal("tip"),
      v.literal("follow"),
    ),
    recipientId: v.id("users"),

    // Grouping (write-time aggregation)
    groupKey: v.string(),
    actorIds: v.array(v.id("users")),
    actorCount: v.number(),

    // Related entities
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    tipId: v.optional(v.id("tips")),
    tipAmount: v.optional(v.number()),
    tipCurrency: v.optional(v.string()),

    // State
    isRead: v.boolean(),
    lastActivityAt: v.number(),
  })
    .index("by_recipient", ["recipientId", "lastActivityAt"])
    .index("by_recipient_read", ["recipientId", "isRead"])
    .index("by_recipient_type", ["recipientId", "type", "lastActivityAt"])
    .index("by_group", ["recipientId", "groupKey"])
    .index("by_post", ["postId"]),

  userStats: defineTable({
    userId: v.id("users"),
    postsCount: v.number(),
    subscribersCount: v.number(),
    followersCount: v.optional(v.number()),
    totalLikes: v.number(),
    tipsReceived: v.optional(v.number()),
    totalTipsAmount: v.optional(v.number()),
    lastUpdated: v.number(),
  }).index("by_userId", ["userId"]),

  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_blocker_blocked", ["blockerId", "blockedId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  reports: defineTable({
    reporterId: v.id("users"),
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
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("resolved"),
      v.literal("rejected"),
    ),
    resolutionAction: v.optional(
      v.union(
        v.literal("banned"),
        v.literal("content_deleted"),
        v.literal("dismissed"),
      ),
    ),
    adminNotes: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported_user", ["reportedUserId"])
    .index("by_reported_post", ["reportedPostId"])
    .index("by_reported_comment", ["reportedCommentId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_created_at", ["createdAt"])
    // Indexes for duplicate prevention
    .index("by_reporter_post", ["reporterId", "reportedPostId"])
    .index("by_reporter_user", ["reporterId", "reportedUserId"])
    .index("by_reporter_comment", ["reporterId", "reportedCommentId"]),

  validationDocumentsDraft: defineTable({
    userId: v.id("users"),
    mediaUrl: v.string(),
    documentType: v.union(v.literal("identity_card"), v.literal("selfie")),
  })
    .index("by_userId", ["userId"])
    .index("by_mediaUrl", ["mediaUrl"]),

  assetsDraft: defineTable({
    author: v.id("users"),
    mediaId: v.string(),
    mediaUrl: v.string(),
    assetType: v.union(v.literal("image"), v.literal("video")),
  })
    .index("by_author", ["author"])
    .index("by_mediaUrl", ["mediaUrl"])
    .index("by_mediaId", ["mediaId"]),

  pendingNotifications: defineTable({
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("newPost"),
      v.literal("newSubscription"),
      v.literal("renewSubscription"),
      v.literal("subscriptionExpired"),
      v.literal("subscriptionConfirmed"),
      v.literal("creatorApplicationApproved"),
      v.literal("creatorApplicationRejected"),
      v.literal("tip"),
      v.literal("follow"),
    ),
    actorId: v.id("users"),
    recipientIds: v.array(v.id("users")),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    tipId: v.optional(v.id("tips")),
    tipAmount: v.optional(v.number()),
    tipCurrency: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    lastAttemptAt: v.optional(v.number()),
    processedCount: v.number(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_status_createdAt", ["status", "createdAt"]),

  // Stats dénormalisées pour le dashboard (évite full table scans)
  platformStats: defineTable({
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
})
