/**
 * Social Links Utilities
 * Detection and extraction functions for social media URLs
 */

export type SocialPlatform =
  | "twitter"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "snapchat"
  | "facebook"
  | "website"
  | "other"

// Platform URL patterns for detection
const PLATFORM_PATTERNS: Record<string, RegExp[]> = {
  twitter: [/twitter\.com/i, /x\.com/i],
  instagram: [/instagram\.com/i],
  tiktok: [/tiktok\.com/i],
  youtube: [/youtube\.com/i, /youtu\.be/i],
  linkedin: [/linkedin\.com/i],
  snapchat: [/snapchat\.com/i, /snap\.com/i],
  facebook: [/facebook\.com/i, /fb\.com/i, /fb\.me/i],
}

/**
 * Detect platform from URL
 * Returns 'website' for non-social URLs, 'other' should be manually set
 */
export function detectPlatform(url: string): SocialPlatform {
  const lowercaseUrl = url.toLowerCase()

  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(lowercaseUrl))) {
      return platform as SocialPlatform
    }
  }

  return "website"
}

/**
 * Extract username from social media URL
 */
export function extractUsername(
  url: string,
  platform: SocialPlatform
): string | undefined {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.replace(/^\//, "").replace(/\/$/, "")
    const segments = pathname.split("/").filter(Boolean)

    switch (platform) {
      case "twitter":
      case "instagram":
      case "tiktok":
        // Format: /@username or /username
        if (segments[0]) {
          return segments[0].startsWith("@") ? segments[0] : `@${segments[0]}`
        }
        return undefined

      case "youtube":
        // Formats: /@channel, /channel/ID, /c/name, /user/name
        if (pathname.startsWith("@")) {
          return segments[0]
        }
        if (
          segments[0] === "channel" ||
          segments[0] === "c" ||
          segments[0] === "user"
        ) {
          return segments[1]
        }
        return undefined

      case "linkedin":
        // Format: /in/username or /company/name
        if (segments[0] === "in" || segments[0] === "company") {
          return segments[1]
        }
        return undefined

      case "snapchat":
        // Format: /add/username
        if (segments[0] === "add") {
          return segments[1]
        }
        return segments[0]

      case "facebook":
        // Format: /username or /profile.php?id=...
        if (segments[0] && segments[0] !== "profile.php") {
          return segments[0]
        }
        return undefined

      default:
        return urlObj.hostname
    }
  } catch {
    return undefined
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Normalize URL by adding https:// if missing
 */
export function normalizeUrl(url: string): string {
  if (!url) return url
  const trimmed = url.trim()
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`
  }
  return trimmed
}
