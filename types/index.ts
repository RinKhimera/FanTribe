import { Doc, Id } from "@/convex/_generated/dataModel"

// ============================================================================
// Types basés sur le schema Convex (utilisent Doc<> pour cohérence)
// ============================================================================

/**
 * Type utilisateur étendu avec union undefined pour les queries conditionnelles
 * @deprecated Préférer Doc<"users"> | undefined directement
 */
export type UserProps = Doc<"users"> | undefined

// ============================================================================
// Types pour la messagerie (nouveau système)
// ============================================================================

/**
 * Type pour les médias attachés aux messages
 */
export type MessageMedia = {
  type: "image" | "video" | "audio" | "document"
  url: string
  mediaId: string
  mimeType: string
  fileName?: string
  fileSize?: number
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
}

/**
 * Type pour les réactions sur les messages
 */
export type MessageReaction = {
  emoji: string
  userId: Id<"users">
  createdAt: number
}

/**
 * Type pour l'expéditeur d'un message (version simplifiée)
 */
export type MessageSender = {
  _id: Id<"users">
  name: string
  username?: string
  image: string
  accountType: "USER" | "CREATOR" | "SUPERUSER"
}

/**
 * Type pour un message de réponse (preview)
 */
export type ReplyToMessage = {
  _id: Id<"messages">
  content?: string
  senderId: Id<"users">
}

/**
 * Type pour les messages enrichis avec les infos du sender
 */
export type MessageProps = {
  _id: Id<"messages">
  conversationId: Id<"conversations">
  senderId: Id<"users">
  content?: string
  medias?: MessageMedia[]
  messageType: "text" | "media" | "system"
  systemMessageType?:
    | "conversation_started"
    | "subscription_expired"
    | "subscription_renewed"
    | "conversation_locked"
    | "conversation_unlocked"
  replyToMessageId?: Id<"messages">
  reactions?: MessageReaction[]
  isEdited?: boolean
  editedAt?: number
  isDeleted?: boolean
  deletedAt?: number
  _creationTime: number
  sentWhileLocked?: boolean
  sender: MessageSender | null
  replyToMessage?: ReplyToMessage | null
}

/**
 * Type pour l'autre participant d'une conversation
 */
export type ConversationParticipant = {
  _id: Id<"users">
  name: string
  username?: string
  image: string
  isOnline: boolean
  lastSeenAt?: number
  accountType: "USER" | "CREATOR" | "SUPERUSER"
}

/**
 * Type pour les conversations enrichies avec métadonnées temps réel
 */
export type ConversationProps = {
  _id: Id<"conversations">
  creatorId: Id<"users">
  userId: Id<"users">
  lastMessageAt?: number
  lastMessagePreview?: string
  lastMessageSenderId?: Id<"users">
  isLocked: boolean
  lockedAt?: number
  lockedReason?: "subscription_expired" | "admin_blocked"
  _creationTime: number
  // Champs enrichis par les queries
  role: "creator" | "user" | "admin"
  otherParticipant: ConversationParticipant | null
  unreadCount: number
  hasUnread: boolean
  isPinned: boolean
  isMuted: boolean
}

/**
 * Type pour les indicateurs de frappe
 */
export type TypingIndicator = {
  _id: Id<"typingIndicators">
  conversationId: Id<"conversations">
  userId: Id<"users">
  startedAt: number
  expiresAt: number
  user: {
    _id: Id<"users">
    name: string
    image: string
  } | null
}

/**
 * Type pour les permissions de messagerie
 */
export type MessagingPermissions = {
  canSend: boolean
  canRead: boolean
  canSendMedia: boolean
  isLocked: boolean
  reason?: string
  requiresSubscription?: boolean
}

/**
 * @deprecated Ancien type - utiliser le nouveau ConversationProps
 */
export type LegacyConversationProps =
  | {
      _id: Id<"conversations">
      image?: string
      participants: Id<"users">[]
      isGroup: boolean
      name?: string
      groupImage?: string
      groupName?: string
      admin?: Id<"users">
      isOnline?: boolean
      _creationTime: number
      lastActivityTime: number
      hasUnreadMessages: boolean
      unreadCount: number
      lastMessage?: {
        _id: Id<"messages">
        conversation: Id<"conversations">
        content: string
        sender: Id<"users">
        messageType: "text" | "image" | "video"
        _creationTime: number
      }
    }
  | undefined

/**
 * Type pour les candidatures créateur enrichies avec user et facteurs de risque
 */
export type Application = Doc<"creatorApplications"> & {
  user:
    | (Doc<"users"> & {
        creatorApplicationStatus?: "none" | "pending" | "approved" | "rejected"
      })
    | null
  riskFactors?: Array<{ message: string; level: "FAIBLE" | "MODÉRÉ" | "GRAVE" }>
}

// ============================================================================
// Types pour les signalements (enrichis avec relations)
// ============================================================================

/**
 * Type pour les posts signalés enrichis avec l'auteur
 */
export interface ReportedPost {
  _id: Id<"posts">
  _creationTime: number
  content: string
  medias: string[]
  visibility: "public" | "subscribers_only"
  author: Doc<"users"> | null
}

/**
 * Type pour les commentaires signalés enrichis avec l'auteur et le post
 */
export interface ReportedComment {
  _id: Id<"comments">
  _creationTime: number
  content: string
  post: Doc<"posts"> | null
  author: Doc<"users"> | null
}

export interface Report {
  _id: Id<"reports">
  _creationTime: number
  reporterId: Id<"users">
  reportedUserId?: Id<"users">
  reportedPostId?: Id<"posts">
  reportedCommentId?: Id<"comments">
  type: "user" | "post" | "comment"
  reason:
    | "spam"
    | "harassment"
    | "inappropriate_content"
    | "fake_account"
    | "copyright"
    | "violence"
    | "hate_speech"
    | "other"
  description?: string
  status: "pending" | "reviewing" | "resolved" | "rejected"
  adminNotes?: string
  reviewedBy?: Id<"users">
  reviewedAt?: number
  createdAt: number
  reporter: Doc<"users"> | null
  reportedUser: Doc<"users"> | null
  reportedPost: ReportedPost | null
  reportedComment: ReportedComment | null
  reviewedByUser: Doc<"users"> | null
}

// ============================================================================
// Types pour les services de paiement
// ============================================================================

export type PaymentStatus = {
  depositId: string
  status: string
  requestedAmount: string
  depositedAmount: string
  currency: string
  country: string
  payer: {
    type: string
    address: {
      value: string
    }
  }
  correspondent: string
  statementDescription: string
  customerTimestamp: string
  created: string
  respondedByPayer: string
  correspondentIds: {
    [key: string]: string
  }
  metadata: {
    creatorId: Id<"users">
    creatorUsername: string
  }
}

export type CinetPayResponse = {
  code: string
  message: string
  data: {
    amount: string
    currency: string
    status: string
    payment_method: string
    description: string
    metadata: unknown
    operator_id: string | null
    payment_date: string
    fund_availability_date: string
  }
  api_response_id: string
}

// ============================================================================
// Types pour Bunny.net CDN
// ============================================================================

export interface BunnyVideoGetResponse {
  videoLibraryId: number
  guid: string
  title: string
  dateUploaded: string
  views: number
  isPublic: boolean
  length: number
  status: number
  framerate: number
  rotation: number
  width: number
  height: number
  availableResolutions: string
  thumbnailCount: number
  encodeProgress: number
  storageSize: number
  captions: Array<{
    srclang: string
    label: string
  }>
  hasMP4Fallback: boolean
  collectionId: string
  thumbnailFileName: string
  averageWatchTime: number
  totalWatchTime: number
  category: string
  chapters: Array<{
    title: string
    start: number
    end: number
  }>
  moments: Array<{
    label: string
    timestamp: number
  }>
  metaTags: Array<{
    property: string
    value: string
  }>
  transcodingMessages: string[]
  jitEncodingEnabled: boolean
}

export interface BunnyVideoUploadResponse {
  success: boolean
  message: string
  statusCode: number
}

export enum BunnyVideoStatus {
  CREATED = 0,
  UPLOADED = 1,
  PROCESSING = 2,
  TRANSCODING = 3,
  FINISHED = 4,
  ERROR = 5,
}

export interface BunnyApiResponse {
  success: boolean
  url: string
  mediaId: string
  type: "image" | "video"
  error?: string
}

export interface BunnyApiErrorResponse {
  error: string
}

export interface BunnyCollectionCreateResponse {
  videoLibraryId: number
  guid: string
  name: string
  videoCount: number
  totalSize: number
  previewVideoIds: string
}

export type BunnyDeleteResponse = {
  success: boolean
  message: string | null
  statusCode: number
}
