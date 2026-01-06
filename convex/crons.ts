import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Exécution quotidienne à 00:00 UTC pour vérifier les abonnements expirés
crons.daily(
  "check-expired-subscriptions",
  { hourUTC: 0, minuteUTC: 0 },
  internal.subscriptions.checkAndUpdateExpiredSubscriptions,
)

// Exécution tous les jours à 03:00 UTC (pour ne pas interférer avec d'autres opérations)
crons.daily(
  "clean-draft-assets",
  { hourUTC: 3, minuteUTC: 0 },
  internal.assetsDraft.cleanUpDraftAssets,
)

// Traitement de la queue de notifications toutes les minutes
// Permet un fan-out progressif sans surcharger le système
crons.interval(
  "process-notification-queue",
  { minutes: 1 },
  internal.notificationQueue.processNextBatches,
)

// Vérification des utilisateurs inactifs toutes les 2 minutes
// Marque comme hors ligne ceux qui n'ont pas envoyé de heartbeat
crons.interval(
  "mark-stale-users-offline",
  { minutes: 2 },
  internal.users.markStaleUsersOffline,
)

// Nettoyage des batches terminés (une fois par jour à 04:00 UTC)
crons.daily(
  "cleanup-notification-batches",
  { hourUTC: 4, minuteUTC: 0 },
  internal.notificationQueue.cleanupCompletedBatches,
)

// Rafraîchir les stats de la plateforme toutes les 5 minutes
crons.interval(
  "refresh-platform-stats",
  { minutes: 5 },
  internal.superuser.refreshPlatformStats,
)

export default crons
