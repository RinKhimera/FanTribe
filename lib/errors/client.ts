/**
 * Utilitaires pour la gestion des erreurs côté client
 * Extrait les messages d'erreur en français depuis les erreurs Convex
 */
import { ConvexError } from "convex/values"

/**
 * Type guard pour vérifier si une erreur est une AppError Convex
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
 * Extrait le message d'erreur utilisateur (en français) depuis une erreur
 * Retourne un message générique si l'erreur n'est pas reconnue
 *
 * @example
 * try {
 *   await createPost({ content })
 * } catch (error) {
 *   toast.error(getUserErrorMessage(error))
 * }
 */
export const getUserErrorMessage = (error: unknown): string => {
  // Erreur personnalisée FanTribe
  if (isAppError(error)) {
    return (error.data as { userMessage: string }).userMessage
  }

  // Erreur Convex standard (string)
  if (error instanceof ConvexError) {
    const data = error.data
    if (typeof data === "string") {
      return translateConvexError(data)
    }
    return String(data)
  }

  // Erreur JavaScript standard
  if (error instanceof Error) {
    return translateConvexError(error.message)
  }

  return "Une erreur inattendue s'est produite"
}

/**
 * Traduit les messages d'erreur Convex courants en français
 */
const translateConvexError = (message: string): string => {
  const translations: Record<string, string> = {
    "Not authenticated": "Vous devez être connecté pour effectuer cette action",
    "User not found": "Utilisateur introuvable",
    "Post not found": "Publication introuvable",
    Unauthorized: "Vous n'êtes pas autorisé à effectuer cette action",
    "Rate limit exceeded": "Trop de requêtes, veuillez réessayer plus tard",
    "Internal server error": "Une erreur serveur s'est produite",
  }

  // Recherche d'une traduction correspondante
  for (const [key, translation] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation
    }
  }

  return message
}

/**
 * Extrait le code d'erreur depuis une AppError
 */
export const getErrorCode = (error: unknown): string | null => {
  if (isAppError(error)) {
    return (error.data as { code: string }).code
  }
  return null
}

/**
 * Vérifie si une erreur est d'un type spécifique
 *
 * @example
 * if (isErrorCode(error, "NOT_AUTHENTICATED")) {
 *   router.push("/auth/sign-in")
 * }
 */
export const isErrorCode = (error: unknown, code: string): boolean => {
  return getErrorCode(error) === code
}
