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
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_username", ["username"])
    .index("by_externalId", ["externalId"])
    .index("by_accountType", ["accountType"])
    .index("by_isOnline", ["isOnline"])
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
    medias: v.array(v.string()),
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

  conversations: defineTable({
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    admin: v.optional(v.id("users")),
  }),

  messages: defineTable({
    conversation: v.id("conversations"),
    sender: v.id("users"),
    content: v.string(),
    read: v.optional(v.boolean()),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
    ),
  }).index("by_conversation", ["conversation"]),

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
    .index("by_providerTransactionId", ["providerTransactionId"]),

  notifications: defineTable({
    type: v.union(
      v.literal("newPost"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("newSubscription"),
      v.literal("renewSubscription"),
      v.literal("subscription_expired"),
    ),
    recipientId: v.id("users"),
    sender: v.id("users"),
    read: v.boolean(),
    post: v.optional(v.id("posts")),
    comment: v.optional(v.id("comments")),
  })
    .index("by_post", ["post"])
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_type", ["recipientId", "type"])
    .index("by_recipient_read", ["recipientId", "read"])
    .index("by_type_post_sender", ["type", "post", "sender"])
    .index("by_type_comment_sender", ["type", "comment", "sender"]),

  userStats: defineTable({
    userId: v.id("users"),
    postsCount: v.number(),
    subscribersCount: v.number(),
    totalLikes: v.number(),
    lastUpdated: v.number(),
  }).index("by_userId", ["userId"]),

  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_blocker_blocked", ["blockerId", "blockedId"]),

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
      v.literal("newPost"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("newSubscription"),
      v.literal("renewSubscription"),
      v.literal("subscription_expired"),
    ),
    sender: v.id("users"),
    recipientIds: v.array(v.id("users")),
    post: v.optional(v.id("posts")),
    comment: v.optional(v.id("comments")),
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
})
