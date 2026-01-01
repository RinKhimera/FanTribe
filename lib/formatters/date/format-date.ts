import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  format,
  isToday,
  isYesterday,
} from "date-fns"
import { fr } from "date-fns/locale"

// ============================================
// Types
// ============================================

export type DateInput = number | Date

export type TimeAgoFormat = "full" | "short" | "minimal"

interface MessageWithTime {
  _creationTime: number
}

// ============================================
// Low-level Utilities
// ============================================

const toDate = (input: DateInput): Date =>
  input instanceof Date ? input : new Date(input)

export const isSameDay = (timestamp1: number, timestamp2: number): boolean => {
  const date1 = new Date(timestamp1)
  const date2 = new Date(timestamp2)
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// ============================================
// Message/Chat Date Formatting
// ============================================

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)

  if (isToday(date)) {
    return format(date, "HH:mm", { locale: fr })
  } else if (isYesterday(date)) {
    return "Hier"
  } else {
    return format(date, "dd-MM-yyyy", { locale: fr })
  }
}

export const getRelativeDateTime = (
  message: MessageWithTime,
  previousMessage: MessageWithTime | null | undefined
): string | undefined => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  const messageDate = new Date(message._creationTime)

  if (
    !previousMessage ||
    !isSameDay(previousMessage._creationTime, messageDate.getTime())
  ) {
    if (isSameDay(messageDate.getTime(), today.getTime())) {
      return "Aujourd'hui"
    } else if (isSameDay(messageDate.getTime(), yesterday.getTime())) {
      return "Hier"
    } else if (messageDate.getTime() > lastWeek.getTime()) {
      return messageDate.toLocaleDateString(undefined, { weekday: "long" })
    } else {
      return messageDate.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
  }
  return undefined
}

// ============================================
// Post Date Formatting
// ============================================

export const formatPostDate = (timestamp: DateInput): string => {
  const date = toDate(timestamp)
  const now = new Date()

  const minutes = differenceInMinutes(now, date)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes}m`

  if (isYesterday(date)) return "hier"

  const hours = differenceInHours(now, date)
  if (hours < 24 && date.getDate() === now.getDate()) {
    return `il y a ${Math.max(1, hours)}h`
  }

  return format(date, "d MMM", { locale: fr })
}

// ============================================
// Time Ago Formatting (multiple formats)
// ============================================

export const formatTimeAgo = (
  timestamp: number,
  formatStyle: TimeAgoFormat = "short"
): string => {
  const now = new Date()
  const date = new Date(timestamp)

  const minutes = differenceInMinutes(now, date)
  const hours = differenceInHours(now, date)
  const days = differenceInDays(now, date)
  const weeks = differenceInWeeks(now, date)
  const months = differenceInMonths(now, date)

  if (formatStyle === "minimal") {
    // Ultra-compact: "5m", "2h", "3j"
    if (months > 1) return `+${months}mois`
    if (weeks >= 1) return `${weeks}sem`
    if (days >= 1) return `${days}j`
    if (hours >= 1) return `${hours}h`
    if (minutes >= 1) return `${minutes}m`
    return "mnt"
  }

  if (formatStyle === "short") {
    // Short: "5 m", "2 h", "3 j", "1 sem."
    if (months > 1) return `+${months} mois`
    if (weeks >= 1) return `${weeks} sem.`
    if (days >= 1) return `${days} j`
    if (hours >= 1) return `${hours} h`
    if (minutes >= 1) return `${minutes} m`
    return "mnt."
  }

  // Full format with "il y a"
  if (months > 1) return `il y a ${months} mois`
  if (weeks >= 1) return `il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`
  if (days >= 1) return `il y a ${days} jour${days > 1 ? "s" : ""}`
  if (hours >= 1) return `il y a ${hours} heure${hours > 1 ? "s" : ""}`
  if (minutes >= 1) return `il y a ${minutes} minute${minutes > 1 ? "s" : ""}`
  return "à l'instant"
}

// Backward compatibility alias
export const formatCustomTimeAgo = (timestamp: number): string =>
  formatTimeAgo(timestamp, "short")

// ============================================
// Last Seen / Presence Formatting
// ============================================

export const formatLastSeen = (
  timestamp: number | undefined,
  isOnline: boolean
): string => {
  if (isOnline) return "En ligne"
  if (!timestamp) return "Hors ligne"

  const now = new Date()
  const date = new Date(timestamp)

  const seconds = differenceInSeconds(now, date)
  const minutes = differenceInMinutes(now, date)
  const hours = differenceInHours(now, date)
  const days = differenceInDays(now, date)
  const weeks = differenceInWeeks(now, date)
  const months = differenceInMonths(now, date)

  if (seconds < 60) return "Vu à l'instant"
  if (minutes < 60) {
    return minutes === 1 ? "Vu il y a 1 minute" : `Vu il y a ${minutes} minutes`
  }
  if (hours < 24) {
    return hours === 1 ? "Vu il y a 1 heure" : `Vu il y a ${hours} heures`
  }
  if (days < 7) {
    return days === 1 ? "Vu hier" : `Vu il y a ${days} jours`
  }
  if (weeks < 4) {
    return weeks === 1 ? "Vu il y a 1 semaine" : `Vu il y a ${weeks} semaines`
  }
  if (months < 12) {
    return months === 1 ? "Vu il y a 1 mois" : `Vu il y a ${months} mois`
  }
  return "Vu il y a longtemps"
}

export const formatLastSeenShort = (
  timestamp: number | undefined,
  isOnline: boolean
): string => {
  if (isOnline) return "En ligne"
  if (!timestamp) return "Hors ligne"

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
