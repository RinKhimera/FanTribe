/**
 * Convex Library - Utilitaires et helpers partagés
 *
 * Ce module centralise les fonctions utilitaires réutilisables dans les
 * mutations, queries et actions Convex.
 */

// Gestion des erreurs
export {
  createAppError,
  isAppError,
  getUserErrorMessage,
  type ErrorCode,
} from "./errors"

// Authentification et autorisation
export { getAuthenticatedUser, requireSuperuser, requireCreator } from "./auth"

// Gestion des blocages
export { getBlockedUserIds, isBlocked, filterBlockedUsers } from "./blocks"

// Gestion des abonnements
export {
  getActiveSubscribedCreatorIds,
  hasActiveSubscription,
  getCreatorSubscribers,
  canViewSubscribersOnlyContent,
  filterPostMediasForViewer,
  type SubscriptionType,
  type SubscriptionStatus,
} from "./subscriptions"

// Notifications (fan-out pattern)
export {
  NOTIFICATION_BATCH_SIZE,
  FANOUT_THRESHOLD,
  createNotificationBatch,
  type NotificationType,
} from "./notifications"

// Batch fetching utilities
export { batchGetUsers, batchGetPosts, batchGetComments } from "./batch"

// Signed URLs pour Bunny CDN (optionnel)
export { generateSignedBunnyUrl, signBunnyUrls } from "./signedUrls"
