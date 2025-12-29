import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
} from "date-fns"

/**
 * Formats the last seen timestamp into a human-readable French string.
 * Uses exact time format as requested.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string like "En ligne", "Vu il y a 5 minutes", etc.
 */
export const formatLastSeen = (
  timestamp: number | undefined,
  isOnline: boolean,
): string => {
  if (isOnline) {
    return "En ligne"
  }

  if (!timestamp) {
    return "Hors ligne"
  }

  const now = new Date()
  const date = new Date(timestamp)

  const seconds = differenceInSeconds(now, date)
  const minutes = differenceInMinutes(now, date)
  const hours = differenceInHours(now, date)
  const days = differenceInDays(now, date)
  const weeks = differenceInWeeks(now, date)
  const months = differenceInMonths(now, date)

  // Less than 1 minute
  if (seconds < 60) {
    return "Vu à l'instant"
  }

  // Less than 1 hour
  if (minutes < 60) {
    if (minutes === 1) {
      return "Vu il y a 1 minute"
    }
    return `Vu il y a ${minutes} minutes`
  }

  // Less than 24 hours
  if (hours < 24) {
    if (hours === 1) {
      return "Vu il y a 1 heure"
    }
    return `Vu il y a ${hours} heures`
  }

  // Less than 7 days
  if (days < 7) {
    if (days === 1) {
      return "Vu hier"
    }
    return `Vu il y a ${days} jours`
  }

  // Less than 4 weeks
  if (weeks < 4) {
    if (weeks === 1) {
      return "Vu il y a 1 semaine"
    }
    return `Vu il y a ${weeks} semaines`
  }

  // Months
  if (months < 12) {
    if (months === 1) {
      return "Vu il y a 1 mois"
    }
    return `Vu il y a ${months} mois`
  }

  // More than a year
  return "Vu il y a longtemps"
}

/**
 * Short format for compact UI elements (badges, avatars)
 * @param timestamp - Unix timestamp in milliseconds
 * @param isOnline - Whether the user is currently online
 * @returns Short formatted string
 */
export const formatLastSeenShort = (
  timestamp: number | undefined,
  isOnline: boolean,
): string => {
  if (isOnline) {
    return "En ligne"
  }

  if (!timestamp) {
    return "Hors ligne"
  }

  const now = new Date()
  const date = new Date(timestamp)

  const minutes = differenceInMinutes(now, date)
  const hours = differenceInHours(now, date)
  const days = differenceInDays(now, date)
  const weeks = differenceInWeeks(now, date)
  const months = differenceInMonths(now, date)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}j`
  if (weeks < 4) return `${weeks}sem`
  if (months < 12) return `${months}mois`
  return "+1an"
}
