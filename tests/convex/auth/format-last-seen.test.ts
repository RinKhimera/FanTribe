import { describe, expect, it } from "vitest"
import {
  formatLastSeen,
  formatLastSeenShort,
} from "../../../lib/formatters/format-last-seen"

describe("formatLastSeen", () => {
  describe("online status", () => {
    it("should return 'En ligne' when user is online", () => {
      const result = formatLastSeen(Date.now(), true)
      expect(result).toBe("En ligne")
    })

    it("should return 'En ligne' even with old timestamp when online", () => {
      const oldTimestamp = Date.now() - 24 * 60 * 60 * 1000 // 1 day ago
      const result = formatLastSeen(oldTimestamp, true)
      expect(result).toBe("En ligne")
    })
  })

  describe("offline status - seconds", () => {
    it("should return 'Vu à l'instant' for less than 60 seconds", () => {
      const tenSecondsAgo = Date.now() - 10 * 1000
      const result = formatLastSeen(tenSecondsAgo, false)
      expect(result).toBe("Vu à l'instant")
    })
  })

  describe("offline status - minutes", () => {
    it("should return 'Vu il y a 1 minute' for exactly 1 minute", () => {
      const oneMinuteAgo = Date.now() - 60 * 1000
      const result = formatLastSeen(oneMinuteAgo, false)
      expect(result).toBe("Vu il y a 1 minute")
    })

    it("should return 'Vu il y a X minutes' for multiple minutes", () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const result = formatLastSeen(fiveMinutesAgo, false)
      expect(result).toBe("Vu il y a 5 minutes")
    })

    it("should return 'Vu il y a 59 minutes' for just under an hour", () => {
      const fiftyNineMinutesAgo = Date.now() - 59 * 60 * 1000
      const result = formatLastSeen(fiftyNineMinutesAgo, false)
      expect(result).toBe("Vu il y a 59 minutes")
    })
  })

  describe("offline status - hours", () => {
    it("should return 'Vu il y a 1 heure' for exactly 1 hour", () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      const result = formatLastSeen(oneHourAgo, false)
      expect(result).toBe("Vu il y a 1 heure")
    })

    it("should return 'Vu il y a X heures' for multiple hours", () => {
      const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000
      const result = formatLastSeen(fiveHoursAgo, false)
      expect(result).toBe("Vu il y a 5 heures")
    })

    it("should return 'Vu il y a 23 heures' for just under a day", () => {
      const twentyThreeHoursAgo = Date.now() - 23 * 60 * 60 * 1000
      const result = formatLastSeen(twentyThreeHoursAgo, false)
      expect(result).toBe("Vu il y a 23 heures")
    })
  })

  describe("offline status - days", () => {
    it("should return 'Vu hier' for exactly 1 day", () => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const result = formatLastSeen(oneDayAgo, false)
      expect(result).toBe("Vu hier")
    })

    it("should return 'Vu il y a X jours' for multiple days", () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
      const result = formatLastSeen(threeDaysAgo, false)
      expect(result).toBe("Vu il y a 3 jours")
    })

    it("should return 'Vu il y a 6 jours' for just under a week", () => {
      const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000
      const result = formatLastSeen(sixDaysAgo, false)
      expect(result).toBe("Vu il y a 6 jours")
    })
  })

  describe("offline status - weeks", () => {
    it("should return 'Vu il y a 1 semaine' for exactly 1 week", () => {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const result = formatLastSeen(oneWeekAgo, false)
      expect(result).toBe("Vu il y a 1 semaine")
    })

    it("should return 'Vu il y a X semaines' for multiple weeks", () => {
      const threeWeeksAgo = Date.now() - 21 * 24 * 60 * 60 * 1000
      const result = formatLastSeen(threeWeeksAgo, false)
      expect(result).toBe("Vu il y a 3 semaines")
    })
  })

  describe("offline status - months", () => {
    it("should return 'Vu il y a 1 mois' for exactly 1 month", () => {
      const oneMonthAgo = Date.now() - 31 * 24 * 60 * 60 * 1000
      const result = formatLastSeen(oneMonthAgo, false)
      expect(result).toBe("Vu il y a 1 mois")
    })

    it("should return 'Vu il y a X mois' for multiple months", () => {
      // Use 150 days (~5 months) to account for date-fns month calculation
      const fiveMonthsAgo = Date.now() - 150 * 24 * 60 * 60 * 1000
      const result = formatLastSeen(fiveMonthsAgo, false)
      expect(result).toMatch(/Vu il y a \d+ mois/)
    })
  })

  describe("offline status - edge cases", () => {
    it("should return 'Vu il y a longtemps' for over a year", () => {
      const overAYearAgo = Date.now() - 400 * 24 * 60 * 60 * 1000
      const result = formatLastSeen(overAYearAgo, false)
      expect(result).toBe("Vu il y a longtemps")
    })

    it("should return 'Hors ligne' when timestamp is undefined", () => {
      const result = formatLastSeen(undefined, false)
      expect(result).toBe("Hors ligne")
    })
  })
})

describe("formatLastSeenShort", () => {
  it("should return 'En ligne' when online", () => {
    expect(formatLastSeenShort(Date.now(), true)).toBe("En ligne")
  })

  it("should return 'À l'instant' for less than a minute", () => {
    const tenSecondsAgo = Date.now() - 10 * 1000
    expect(formatLastSeenShort(tenSecondsAgo, false)).toBe("À l'instant")
  })

  it("should return 'Xmin' for minutes", () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    expect(formatLastSeenShort(fiveMinutesAgo, false)).toBe("5min")
  })

  it("should return 'Xh' for hours", () => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000
    expect(formatLastSeenShort(threeHoursAgo, false)).toBe("3h")
  })

  it("should return 'Xj' for days", () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000
    expect(formatLastSeenShort(twoDaysAgo, false)).toBe("2j")
  })

  it("should return 'Xsem' for weeks", () => {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
    expect(formatLastSeenShort(twoWeeksAgo, false)).toBe("2sem")
  })

  it("should return 'Xmois' for months", () => {
    // Use 120 days to ensure we get a proper month count
    const monthsAgo = Date.now() - 120 * 24 * 60 * 60 * 1000
    expect(formatLastSeenShort(monthsAgo, false)).toMatch(/\d+mois/)
  })

  it("should return '+1an' for over a year", () => {
    const overAYearAgo = Date.now() - 400 * 24 * 60 * 60 * 1000
    expect(formatLastSeenShort(overAYearAgo, false)).toBe("+1an")
  })

  it("should return 'Hors ligne' when timestamp is undefined", () => {
    expect(formatLastSeenShort(undefined, false)).toBe("Hors ligne")
  })
})
