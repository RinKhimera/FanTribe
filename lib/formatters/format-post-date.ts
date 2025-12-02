import {
  differenceInHours,
  differenceInMinutes,
  format,
  isYesterday,
} from "date-fns"
import { fr } from "date-fns/locale"

export const formatPostDate = (timestamp: number | Date): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
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
