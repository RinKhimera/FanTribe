/**
 * Logger structuré pour l'application FanTribe
 * Logs console en développement, peut être étendu pour Sentry/Logtail en production
 */

const isDev = process.env.NODE_ENV === "development"

type LogContext = Record<string, any>

export const logger = {
  /**
   * Log d'information (dev seulement)
   */
  info: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(`ℹ️ ${message}`, context || "")
    }
  },

  /**
   * Log d'erreur (toujours actif)
   */
  error: (message: string, error?: any, context?: LogContext) => {
    console.error(`❌ ${message}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    })
    // TODO: Envoyer à Sentry/Logtail en production
  },

  /**
   * Log de succès (dev seulement)
   */
  success: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(`✅ ${message}`, context || "")
    }
  },

  /**
   * Log d'avertissement
   */
  warn: (message: string, context?: LogContext) => {
    console.warn(`⚠️ ${message}`, context || "")
  },

  /**
   * Log de debug (dev seulement)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev) {
      console.debug(`🔍 ${message}`, context || "")
    }
  },
}
