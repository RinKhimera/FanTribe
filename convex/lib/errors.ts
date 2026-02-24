import { ConvexError } from "convex/values"

/**
 * Types d'erreurs personnalisées pour FanTribe
 * Les messages internes sont en anglais (logs), les messages utilisateur en français
 */

export type ErrorCode =
  | "NOT_AUTHENTICATED"
  | "USER_NOT_FOUND"
  | "BANNED"
  | "POST_NOT_FOUND"
  | "COMMENT_NOT_FOUND"
  | "CONVERSATION_NOT_FOUND"
  | "SUBSCRIPTION_NOT_FOUND"
  | "NOTIFICATION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "ALREADY_EXISTS"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR"

// Interface avec index signature pour compatibilité avec Convex Value
export interface ErrorDetails {
  code: ErrorCode
  message: string // Message interne (anglais, pour logs)
  userMessage: string // Message utilisateur (français, pour UI)
  context?: Record<string, unknown>
  [key: string]: unknown // Index signature pour compatibilité Convex
}

/**
 * Mapping des codes d'erreur vers leurs messages par défaut
 */
const ERROR_MESSAGES: Record<
  ErrorCode,
  { message: string; userMessage: string }
> = {
  NOT_AUTHENTICATED: {
    message: "User is not authenticated",
    userMessage: "Vous devez être connecté pour effectuer cette action",
  },
  USER_NOT_FOUND: {
    message: "User not found",
    userMessage: "Utilisateur introuvable",
  },
  BANNED: {
    message: "User account is banned",
    userMessage:
      "Votre compte a été suspendu. Vous ne pouvez pas effectuer cette action.",
  },
  POST_NOT_FOUND: {
    message: "Post not found",
    userMessage: "Publication introuvable",
  },
  COMMENT_NOT_FOUND: {
    message: "Comment not found",
    userMessage: "Commentaire introuvable",
  },
  CONVERSATION_NOT_FOUND: {
    message: "Conversation not found",
    userMessage: "Conversation introuvable",
  },
  SUBSCRIPTION_NOT_FOUND: {
    message: "Subscription not found",
    userMessage: "Abonnement introuvable",
  },
  NOTIFICATION_NOT_FOUND: {
    message: "Notification not found",
    userMessage: "Notification introuvable",
  },
  UNAUTHORIZED: {
    message: "User is not authorized to perform this action",
    userMessage: "Vous n'êtes pas autorisé à effectuer cette action",
  },
  FORBIDDEN: {
    message: "Access forbidden",
    userMessage: "Accès interdit",
  },
  ALREADY_EXISTS: {
    message: "Resource already exists",
    userMessage: "Cette ressource existe déjà",
  },
  INVALID_INPUT: {
    message: "Invalid input provided",
    userMessage: "Les données fournies sont invalides",
  },
  RATE_LIMITED: {
    message: "Rate limit exceeded",
    userMessage: "Trop de requêtes, veuillez réessayer plus tard",
  },
  EXTERNAL_SERVICE_ERROR: {
    message: "External service error",
    userMessage: "Erreur de service externe, veuillez réessayer",
  },
  INTERNAL_ERROR: {
    message: "Internal server error",
    userMessage: "Une erreur inattendue s'est produite",
  },
}

/**
 * Crée une erreur Convex enrichie avec code et messages bilingues
 *
 * @example
 * throw createAppError("NOT_AUTHENTICATED")
 * throw createAppError("UNAUTHORIZED", { context: { userId, postId } })
 * throw createAppError("INVALID_INPUT", { userMessage: "Le contenu est trop long" })
 */
export const createAppError = (
  code: ErrorCode,
  options?: {
    message?: string
    userMessage?: string
    context?: Record<string, string | number | boolean | null>
  },
) => {
  const defaults = ERROR_MESSAGES[code]

  // Construire l'objet d'erreur sans context si undefined
  const errorDetails: Record<
    string,
    | string
    | number
    | boolean
    | null
    | Record<string, string | number | boolean | null>
  > = {
    code,
    message: options?.message ?? defaults.message,
    userMessage: options?.userMessage ?? defaults.userMessage,
  }

  if (options?.context) {
    errorDetails.context = options.context
  }

  // Log l'erreur en interne (message anglais + contexte)
  console.error(`[${code}] ${errorDetails.message}`, options?.context || "")

  return new ConvexError(errorDetails)
}

/**
 * Type guard pour vérifier si une erreur est une AppError
 */
export const isAppError = (
  error: unknown,
): error is ConvexError<{ code: string; userMessage: string }> => {
  if (!(error instanceof ConvexError)) return false
  const data = error.data as Record<string, unknown>
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    "userMessage" in data
  )
}

/**
 * Extrait le message utilisateur d'une erreur (français)
 * Retourne un message générique si l'erreur n'est pas une AppError
 */
export const getUserErrorMessage = (error: unknown): string => {
  if (isAppError(error)) {
    return (error.data as { userMessage: string }).userMessage
  }
  if (error instanceof ConvexError) {
    return String(error.data)
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Une erreur inattendue s'est produite"
}
