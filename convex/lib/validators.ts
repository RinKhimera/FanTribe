import { v } from "convex/values"

// ============================================================================
// Validators réutilisables dérivés du schema
// ============================================================================

export const socialLinkValidator = v.object({
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
})

export const banDetailsValidator = v.object({
  type: v.union(v.literal("temporary"), v.literal("permanent")),
  reason: v.string(),
  bannedAt: v.number(),
  bannedBy: v.id("users"),
  expiresAt: v.optional(v.number()),
})

export const banHistoryEntryValidator = v.object({
  type: v.union(v.literal("temporary"), v.literal("permanent")),
  reason: v.string(),
  bannedAt: v.number(),
  bannedBy: v.id("users"),
  expiresAt: v.optional(v.number()),
  liftedAt: v.optional(v.number()),
  liftedBy: v.optional(v.id("users")),
})

export const badgeValidator = v.object({
  type: v.union(
    v.literal("verified"),
    v.literal("top_creator"),
    v.literal("founding_member"),
    v.literal("popular"),
    v.literal("rising_star"),
  ),
  awardedAt: v.number(),
})

export const personalInfoValidator = v.object({
  fullName: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  address: v.optional(v.string()),
  whatsappNumber: v.optional(v.string()),
  mobileMoneyNumber: v.optional(v.string()),
  mobileMoneyNumber2: v.optional(v.string()),
})

export const userDocValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  name: v.string(),
  username: v.optional(v.string()),
  email: v.string(),
  image: v.string(),
  imageBanner: v.optional(v.string()),
  bio: v.optional(v.string()),
  location: v.optional(v.string()),
  socialLinks: v.optional(v.array(socialLinkValidator)),
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
  personalInfo: v.optional(personalInfoValidator),
  isBanned: v.optional(v.boolean()),
  banDetails: v.optional(banDetailsValidator),
  banHistory: v.optional(v.array(banHistoryEntryValidator)),
  badges: v.optional(v.array(badgeValidator)),
})

export const postMediaValidator = v.object({
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
})

export const postDocValidator = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  author: v.id("users"),
  content: v.string(),
  medias: v.array(postMediaValidator),
  visibility: v.union(v.literal("public"), v.literal("subscribers_only")),
  isAdult: v.optional(v.boolean()),
})

export const subscriptionDocValidator = v.object({
  _id: v.id("subscriptions"),
  _creationTime: v.number(),
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
  grantedByCreator: v.optional(v.boolean()),
  bundlePurchase: v.optional(v.boolean()),
})

export const creatorApplicationDocValidator = v.object({
  _id: v.id("creatorApplications"),
  _creationTime: v.number(),
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

export const tipDocValidator = v.object({
  _id: v.id("tips"),
  _creationTime: v.number(),
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
    v.union(
      v.literal("post"),
      v.literal("profile"),
      v.literal("message"),
    ),
  ),
  postId: v.optional(v.id("posts")),
  conversationId: v.optional(v.id("conversations")),
})

// Pagination result validator (pour les queries paginées)
export const paginationResultValidator = (itemValidator: ReturnType<typeof v.object> | ReturnType<typeof v.any>) =>
  v.object({
    page: v.array(itemValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(
      v.union(
        v.literal("SplitRecommended"),
        v.literal("SplitRequired"),
        v.null(),
      ),
    ),
  })
