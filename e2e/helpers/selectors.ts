// Centralized French-text selectors for E2E tests
// Avoids typos and ensures consistency across specs

// Sidebar navigation
export const NAV = {
  HOME: "Accueil",
  EXPLORE: "Explorer",
  NOTIFICATIONS: "Notifications",
  MESSAGES: "Messages",
  COLLECTIONS: "Collections",
  SUBSCRIPTIONS: "Abonnements",
  DASHBOARD: "Dashboard",
  PROFILE: "Profil",
  ADMIN: "Administration",
  PUBLISH: "Publier",
} as const

// Post action tooltips
export const POST_ACTIONS = {
  LIKE: "J'aime",
  UNLIKE: "Retirer le j'aime",
  COMMENT: "Commenter",
  HIDE_COMMENTS: "Masquer les commentaires",
  SHARE: "Partager",
  TIP: "Envoyer un pourboire",
  BOOKMARK: "Ajouter aux collections",
  UNBOOKMARK: "Retirer des collections",
} as const

// Subscription dialog
export const SUBSCRIPTION = {
  TITLE_PREFIX: "Rejoignez",
  PAY_MOBILE: "Payer avec OM/MOMO",
  PAY_CARD: "Payer avec carte",
  UNSUBSCRIBE: "Se désabonner",
  CANCEL: "Peut-être plus tard",
  PRICE: "1000 XAF",
  FEATURE_CONTENT: "Contenu exclusif et premium",
  FEATURE_COMMUNITY: "Accès à la communauté privée",
  FEATURE_NO_COMMITMENT: "Sans engagement",
} as const

// Tip dialog
export const TIP = {
  TITLE: "Envoyer un pourboire",
  CUSTOM: "Autre",
  MESSAGE_PLACEHOLDER: "Ajouter un message (optionnel)",
  PAY_MOBILE: "Payer avec OM/MOMO",
  PAY_CARD: "Payer avec carte",
} as const

// Toast messages
export const TOAST = {
  LINK_COPIED: "Lien copié",
  BOOKMARKED: "Ajouté aux collections",
  UNBOOKMARKED: "Retiré des collections",
  COMMENT_POSTED: "Commentaire publié",
  FOLLOWING: "Vous suivez maintenant",
  UNFOLLOWING: "Vous ne suivez plus",
  SUBSCRIPTION_CANCELLED: "Abonnement annulé avec succès",
  USER_BLOCKED: "Utilisateur bloqué",
  USER_UNBLOCKED: "Utilisateur débloqué",
  ERROR: "Une erreur s'est produite",
} as const

// Explore page
export const EXPLORE = {
  SEARCH_PLACEHOLDER: "Rechercher sur Explorer…",
  SORT_RECENT: "Récents",
  SORT_TRENDING: "Tendances",
} as const

// Post creation
export const NEW_POST = {
  TITLE: "Nouvelle publication",
  PLACEHOLDER: "Partagez quelque chose avec vos fans…",
  SUBMIT: "Publier",
  VISIBILITY_PUBLIC: "Tout le monde",
  VISIBILITY_SUBSCRIBERS: "Fans uniquement",
  SUCCESS_TOAST: "Votre publication a été partagée",
} as const

// Notification filters
export const NOTIF_FILTERS = {
  ALL: "Tous",
  LIKES: "J'aime",
  COMMENTS: "Commentaires",
  SUBSCRIPTIONS: "Abonnements",
  FOLLOWERS: "Suiveurs",
  POSTS: "Publications",
  TIPS: "Pourboires",
} as const
