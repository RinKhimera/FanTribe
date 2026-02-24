import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  isSameDay,
  formatDate,
  formatPostDate,
  formatTimeAgo,
  formatCustomTimeAgo,
  getRelativeDateTime,
  formatLastSeen,
  formatLastSeenShort,
} from "@/lib/formatters/date/format-date"

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-02-10T12:00:00Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

// ============================================
// isSameDay
// ============================================

describe("isSameDay", () => {
  it("should return true for two timestamps on the same day", () => {
    const ts1 = new Date("2026-02-10T08:00:00Z").getTime()
    const ts2 = new Date("2026-02-10T22:00:00Z").getTime()
    expect(isSameDay(ts1, ts2)).toBe(true)
  })

  it("should return false for two timestamps on different days", () => {
    const ts1 = new Date("2026-02-10T08:00:00Z").getTime()
    const ts2 = new Date("2026-02-09T08:00:00Z").getTime()
    expect(isSameDay(ts1, ts2)).toBe(false)
  })

  it("should return true for the same timestamp", () => {
    const ts = new Date("2026-02-10T12:00:00Z").getTime()
    expect(isSameDay(ts, ts)).toBe(true)
  })
})

// ============================================
// formatDate
// ============================================

describe("formatDate", () => {
  it("should return HH:mm format for today", () => {
    const todayTs = new Date("2026-02-10T10:30:00Z").getTime()
    const result = formatDate(todayTs)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('should return "Hier" for yesterday', () => {
    const yesterdayTs = new Date("2026-02-09T15:00:00Z").getTime()
    expect(formatDate(yesterdayTs)).toBe("Hier")
  })

  it("should return dd-MM-yyyy for older dates", () => {
    const oldTs = new Date("2025-06-15T12:00:00Z").getTime()
    const result = formatDate(oldTs)
    expect(result).toMatch(/\d{2}-\d{2}-\d{4}/)
  })
})

// ============================================
// formatPostDate
// ============================================

describe("formatPostDate", () => {
  it('should return "à l\'instant" for less than 1 minute ago', () => {
    const thirtySecsAgo = new Date("2026-02-10T11:59:30Z").getTime()
    expect(formatPostDate(thirtySecsAgo)).toBe("à l'instant")
  })

  it('should return "il y a Xm" for minutes ago', () => {
    const fiveMinAgo = new Date("2026-02-10T11:55:00Z").getTime()
    expect(formatPostDate(fiveMinAgo)).toBe("il y a 5m")
  })

  it('should return "il y a Xh" for hours ago on the same day', () => {
    const threeHoursAgo = new Date("2026-02-10T09:00:00Z").getTime()
    expect(formatPostDate(threeHoursAgo)).toBe("il y a 3h")
  })

  it('should return "hier" for yesterday', () => {
    const yesterdayTs = new Date("2026-02-09T15:00:00Z").getTime()
    expect(formatPostDate(yesterdayTs)).toBe("hier")
  })

  it("should return a formatted date string for older dates", () => {
    const oldTs = new Date("2025-01-05T12:00:00Z").getTime()
    const result = formatPostDate(oldTs)
    // date-fns fr locale: "5 janv."
    expect(result).toMatch(/\d+\s\w+/)
  })
})

// ============================================
// formatTimeAgo — minimal format
// ============================================

describe("formatTimeAgo — minimal", () => {
  it('should return "mnt" for just now', () => {
    const justNow = new Date("2026-02-10T11:59:50Z").getTime()
    expect(formatTimeAgo(justNow, "minimal")).toBe("mnt")
  })

  it('should return "Xm" for minutes ago', () => {
    const fiveMinAgo = new Date("2026-02-10T11:55:00Z").getTime()
    expect(formatTimeAgo(fiveMinAgo, "minimal")).toBe("5m")
  })

  it('should return "Xh" for hours ago', () => {
    const twoHoursAgo = new Date("2026-02-10T10:00:00Z").getTime()
    expect(formatTimeAgo(twoHoursAgo, "minimal")).toBe("2h")
  })

  it('should return "Xj" for days ago', () => {
    const threeDaysAgo = new Date("2026-02-07T12:00:00Z").getTime()
    expect(formatTimeAgo(threeDaysAgo, "minimal")).toBe("3j")
  })

  it('should return "Xsem" for weeks ago', () => {
    const twoWeeksAgo = new Date("2026-01-27T12:00:00Z").getTime()
    expect(formatTimeAgo(twoWeeksAgo, "minimal")).toBe("2sem")
  })

  it('should return "+Xmois" for months ago', () => {
    const threeMonthsAgo = new Date("2025-11-10T12:00:00Z").getTime()
    expect(formatTimeAgo(threeMonthsAgo, "minimal")).toBe("+3mois")
  })
})

// ============================================
// formatTimeAgo — short format
// ============================================

describe("formatTimeAgo — short", () => {
  it('should return "mnt." for just now', () => {
    const justNow = new Date("2026-02-10T11:59:50Z").getTime()
    expect(formatTimeAgo(justNow, "short")).toBe("mnt.")
  })

  it('should return "X m" for minutes ago', () => {
    const tenMinAgo = new Date("2026-02-10T11:50:00Z").getTime()
    expect(formatTimeAgo(tenMinAgo, "short")).toBe("10 m")
  })

  it('should return "X h" for hours ago', () => {
    const fourHoursAgo = new Date("2026-02-10T08:00:00Z").getTime()
    expect(formatTimeAgo(fourHoursAgo, "short")).toBe("4 h")
  })

  it('should return "X j" for days ago', () => {
    const twoDaysAgo = new Date("2026-02-08T12:00:00Z").getTime()
    expect(formatTimeAgo(twoDaysAgo, "short")).toBe("2 j")
  })

  it('should return "X sem." for weeks ago', () => {
    const threeWeeksAgo = new Date("2026-01-20T12:00:00Z").getTime()
    expect(formatTimeAgo(threeWeeksAgo, "short")).toBe("3 sem.")
  })

  it('should return "+X mois" for months ago', () => {
    const monthsAgo = new Date("2025-09-10T12:00:00Z").getTime()
    expect(formatTimeAgo(monthsAgo, "short")).toMatch(/^\+\d+ mois$/)
  })
})

// ============================================
// formatTimeAgo — full format
// ============================================

describe("formatTimeAgo — full", () => {
  it('should return "à l\'instant" for just now', () => {
    const justNow = new Date("2026-02-10T11:59:50Z").getTime()
    expect(formatTimeAgo(justNow, "full")).toBe("à l'instant")
  })

  it('should return "il y a X minute(s)" for minutes ago', () => {
    const oneMinAgo = new Date("2026-02-10T11:59:00Z").getTime()
    expect(formatTimeAgo(oneMinAgo, "full")).toBe("il y a 1 minute")

    const fiveMinAgo = new Date("2026-02-10T11:55:00Z").getTime()
    expect(formatTimeAgo(fiveMinAgo, "full")).toBe("il y a 5 minutes")
  })

  it('should return "il y a X heure(s)" for hours ago', () => {
    const oneHourAgo = new Date("2026-02-10T11:00:00Z").getTime()
    expect(formatTimeAgo(oneHourAgo, "full")).toBe("il y a 1 heure")

    const threeHoursAgo = new Date("2026-02-10T09:00:00Z").getTime()
    expect(formatTimeAgo(threeHoursAgo, "full")).toBe("il y a 3 heures")
  })

  it('should return "il y a X jour(s)" for days ago', () => {
    const oneDayAgo = new Date("2026-02-09T12:00:00Z").getTime()
    expect(formatTimeAgo(oneDayAgo, "full")).toBe("il y a 1 jour")

    const fiveDaysAgo = new Date("2026-02-05T12:00:00Z").getTime()
    expect(formatTimeAgo(fiveDaysAgo, "full")).toBe("il y a 5 jours")
  })

  it('should return "il y a X semaine(s)" for weeks ago', () => {
    const oneWeekAgo = new Date("2026-02-03T12:00:00Z").getTime()
    expect(formatTimeAgo(oneWeekAgo, "full")).toBe("il y a 1 semaine")

    const twoWeeksAgo = new Date("2026-01-27T12:00:00Z").getTime()
    expect(formatTimeAgo(twoWeeksAgo, "full")).toBe("il y a 2 semaines")
  })

  it('should return "il y a X mois" for months ago', () => {
    const threeMonthsAgo = new Date("2025-11-10T12:00:00Z").getTime()
    expect(formatTimeAgo(threeMonthsAgo, "full")).toBe("il y a 3 mois")
  })
})

// ============================================
// formatCustomTimeAgo
// ============================================

describe("formatCustomTimeAgo", () => {
  it('should delegate to formatTimeAgo with "short" format', () => {
    const fiveMinAgo = new Date("2026-02-10T11:55:00Z").getTime()
    expect(formatCustomTimeAgo(fiveMinAgo)).toBe(
      formatTimeAgo(fiveMinAgo, "short")
    )
  })
})

// ============================================
// getRelativeDateTime
// ============================================

describe("getRelativeDateTime", () => {
  it('should return "Aujourd\'hui" for a today message with no previous', () => {
    const message = { _creationTime: new Date("2026-02-10T10:00:00Z").getTime() }
    expect(getRelativeDateTime(message, null)).toBe("Aujourd'hui")
  })

  it('should return "Hier" for a yesterday message with no previous', () => {
    const message = { _creationTime: new Date("2026-02-09T10:00:00Z").getTime() }
    expect(getRelativeDateTime(message, null)).toBe("Hier")
  })

  it("should return undefined when message is on the same day as previous", () => {
    const message = { _creationTime: new Date("2026-02-10T14:00:00Z").getTime() }
    const previous = { _creationTime: new Date("2026-02-10T10:00:00Z").getTime() }
    expect(getRelativeDateTime(message, previous)).toBeUndefined()
  })
})

// ============================================
// formatLastSeen
// ============================================

describe("formatLastSeen", () => {
  it('should return "En ligne" when isOnline is true', () => {
    expect(formatLastSeen(Date.now(), true)).toBe("En ligne")
  })

  it('should return "Hors ligne" when timestamp is undefined', () => {
    expect(formatLastSeen(undefined, false)).toBe("Hors ligne")
  })

  it('should return "Vu à l\'instant" for less than 60 seconds ago', () => {
    const thirtySecsAgo = new Date("2026-02-10T11:59:40Z").getTime()
    expect(formatLastSeen(thirtySecsAgo, false)).toBe("Vu à l'instant")
  })

  it('should return "Vu il y a 1 minute" for exactly 1 minute ago', () => {
    const oneMinAgo = new Date("2026-02-10T11:59:00Z").getTime()
    expect(formatLastSeen(oneMinAgo, false)).toBe("Vu il y a 1 minute")
  })

  it('should return "Vu il y a X minutes" for multiple minutes ago', () => {
    const tenMinAgo = new Date("2026-02-10T11:50:00Z").getTime()
    expect(formatLastSeen(tenMinAgo, false)).toBe("Vu il y a 10 minutes")
  })

  it('should return "Vu il y a 1 heure" for exactly 1 hour ago', () => {
    const oneHourAgo = new Date("2026-02-10T11:00:00Z").getTime()
    expect(formatLastSeen(oneHourAgo, false)).toBe("Vu il y a 1 heure")
  })

  it('should return "Vu il y a X heures" for multiple hours ago', () => {
    const threeHoursAgo = new Date("2026-02-10T09:00:00Z").getTime()
    expect(formatLastSeen(threeHoursAgo, false)).toBe("Vu il y a 3 heures")
  })

  it('should return "Vu hier" for exactly 1 day ago', () => {
    const oneDayAgo = new Date("2026-02-09T12:00:00Z").getTime()
    expect(formatLastSeen(oneDayAgo, false)).toBe("Vu hier")
  })

  it('should return "Vu il y a X jours" for multiple days ago', () => {
    const fourDaysAgo = new Date("2026-02-06T12:00:00Z").getTime()
    expect(formatLastSeen(fourDaysAgo, false)).toBe("Vu il y a 4 jours")
  })

  it('should return "Vu il y a 1 semaine" for exactly 1 week ago', () => {
    const oneWeekAgo = new Date("2026-02-03T12:00:00Z").getTime()
    expect(formatLastSeen(oneWeekAgo, false)).toBe("Vu il y a 1 semaine")
  })

  it('should return "Vu il y a X semaines" for multiple weeks ago', () => {
    const twoWeeksAgo = new Date("2026-01-27T12:00:00Z").getTime()
    expect(formatLastSeen(twoWeeksAgo, false)).toBe("Vu il y a 2 semaines")
  })

  it('should return "Vu il y a 1 mois" for exactly 1 month ago', () => {
    const oneMonthAgo = new Date("2026-01-10T12:00:00Z").getTime()
    expect(formatLastSeen(oneMonthAgo, false)).toBe("Vu il y a 1 mois")
  })

  it('should return "Vu il y a X mois" for multiple months ago', () => {
    const monthsAgo = new Date("2025-07-01T12:00:00Z").getTime()
    const result = formatLastSeen(monthsAgo, false)
    expect(result).toMatch(/^Vu il y a \d+ mois$/)
  })

  it('should return "Vu il y a longtemps" for more than 12 months ago', () => {
    const overAYearAgo = new Date("2024-01-10T12:00:00Z").getTime()
    expect(formatLastSeen(overAYearAgo, false)).toBe("Vu il y a longtemps")
  })
})

// ============================================
// formatLastSeenShort
// ============================================

describe("formatLastSeenShort", () => {
  it('should return "En ligne" when isOnline is true', () => {
    expect(formatLastSeenShort(Date.now(), true)).toBe("En ligne")
  })

  it('should return "Hors ligne" when timestamp is undefined', () => {
    expect(formatLastSeenShort(undefined, false)).toBe("Hors ligne")
  })

  it('should return "À l\'instant" for less than 1 minute ago', () => {
    const justNow = new Date("2026-02-10T11:59:50Z").getTime()
    expect(formatLastSeenShort(justNow, false)).toBe("À l'instant")
  })

  it('should return "Xmin" for minutes ago', () => {
    const fiveMinAgo = new Date("2026-02-10T11:55:00Z").getTime()
    expect(formatLastSeenShort(fiveMinAgo, false)).toBe("5min")
  })

  it('should return "Xh" for hours ago', () => {
    const threeHoursAgo = new Date("2026-02-10T09:00:00Z").getTime()
    expect(formatLastSeenShort(threeHoursAgo, false)).toBe("3h")
  })

  it('should return "Xj" for days ago', () => {
    const twoDaysAgo = new Date("2026-02-08T12:00:00Z").getTime()
    expect(formatLastSeenShort(twoDaysAgo, false)).toBe("2j")
  })

  it('should return "Xsem" for weeks ago', () => {
    const twoWeeksAgo = new Date("2026-01-27T12:00:00Z").getTime()
    expect(formatLastSeenShort(twoWeeksAgo, false)).toBe("2sem")
  })

  it('should return "Xmois" for months ago', () => {
    const threeMonthsAgo = new Date("2025-11-10T12:00:00Z").getTime()
    expect(formatLastSeenShort(threeMonthsAgo, false)).toBe("3mois")
  })

  it('should return "+1an" for more than 12 months ago', () => {
    const overAYearAgo = new Date("2024-01-10T12:00:00Z").getTime()
    expect(formatLastSeenShort(overAYearAgo, false)).toBe("+1an")
  })
})
