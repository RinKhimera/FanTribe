import { format, isToday, isYesterday } from "date-fns"
import { fr } from "date-fns/locale"

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

export const isSameDay = (timestamp1: number, timestamp2: number): boolean => {
  const date1 = new Date(timestamp1)
  const date2 = new Date(timestamp2)
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export const getRelativeDateTime = (message: any, previousMessage: any) => {
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
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
      }
      return messageDate.toLocaleDateString(undefined, options)
    } else {
      const options: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
      return messageDate.toLocaleDateString(undefined, options)
    }
  }
}
