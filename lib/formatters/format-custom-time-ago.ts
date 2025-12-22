import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInWeeks,
} from "date-fns"

export const formatCustomTimeAgo = (timestamp: number): string => {
  const now = new Date()
  const date = new Date(timestamp)

  const minutes = differenceInMinutes(now, date)
  const hours = differenceInHours(now, date)
  const days = differenceInDays(now, date)
  const weeks = differenceInWeeks(now, date)
  const months = differenceInMonths(now, date)

  if (months > 1) return `+${months} mois`
  if (weeks >= 1) return `${weeks} sem.`
  if (days >= 1) return `${days} j`
  if (hours >= 1) return `${hours} h`
  if (minutes >= 1) return `${minutes} m`
  return "mnt."
}
