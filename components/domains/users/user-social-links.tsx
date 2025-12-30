"use client"

import { motion } from "motion/react"
import { Globe, Instagram, Twitter, Youtube } from "lucide-react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { socialLinkVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"

type SocialPlatform =
  | "twitter"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "website"
  | "other"

interface SocialLink {
  platform: SocialPlatform
  url: string
  username?: string
}

interface UserSocialLinksProps {
  socialLinks?: SocialLink[]
  // Legacy support for old socials array
  legacySocials?: string[]
}

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const platformConfig: Record<
  SocialPlatform,
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
    color: string
    bgColor: string
  }
> = {
  twitter: {
    icon: Twitter,
    label: "Twitter / X",
    color: "text-sky-500",
    bgColor: "bg-sky-500/10 hover:bg-sky-500/20",
  },
  instagram: {
    icon: Instagram,
    label: "Instagram",
    color: "text-pink-500",
    bgColor: "bg-gradient-to-br from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20",
  },
  tiktok: {
    icon: TikTokIcon,
    label: "TikTok",
    color: "text-foreground",
    bgColor: "bg-foreground/10 hover:bg-foreground/20",
  },
  youtube: {
    icon: Youtube,
    label: "YouTube",
    color: "text-red-500",
    bgColor: "bg-red-500/10 hover:bg-red-500/20",
  },
  website: {
    icon: Globe,
    label: "Site web",
    color: "text-primary",
    bgColor: "bg-primary/10 hover:bg-primary/20",
  },
  other: {
    icon: Globe,
    label: "Lien",
    color: "text-muted-foreground",
    bgColor: "bg-muted hover:bg-muted/80",
  },
}

// Helper to detect platform from URL
const detectPlatform = (url: string): SocialPlatform => {
  const lowercaseUrl = url.toLowerCase()
  if (lowercaseUrl.includes("twitter.com") || lowercaseUrl.includes("x.com")) {
    return "twitter"
  }
  if (lowercaseUrl.includes("instagram.com")) {
    return "instagram"
  }
  if (lowercaseUrl.includes("tiktok.com")) {
    return "tiktok"
  }
  if (lowercaseUrl.includes("youtube.com") || lowercaseUrl.includes("youtu.be")) {
    return "youtube"
  }
  return "website"
}

// Extract username from URL
const extractUsername = (url: string, platform: SocialPlatform): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.replace(/^\//, "").replace(/\/$/, "")

    switch (platform) {
      case "twitter":
      case "instagram":
      case "tiktok":
        return `@${pathname.split("/")[0]}`
      case "youtube":
        if (pathname.startsWith("@")) {
          return pathname.split("/")[0]
        }
        if (pathname.startsWith("channel/") || pathname.startsWith("c/")) {
          return pathname.split("/")[1]
        }
        return urlObj.hostname
      default:
        return urlObj.hostname
    }
  } catch {
    return url
  }
}

export const UserSocialLinks = ({
  socialLinks,
  legacySocials,
}: UserSocialLinksProps) => {
  // Convert legacy socials to new format if needed
  const links: SocialLink[] = socialLinks || []

  // Add legacy socials if no new format links exist
  if (links.length === 0 && legacySocials && legacySocials.length > 0) {
    legacySocials.forEach((url) => {
      const platform = detectPlatform(url)
      links.push({
        platform,
        url,
        username: extractUsername(url, platform),
      })
    })
  }

  if (links.length === 0) return null

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) => {
          const config = platformConfig[link.platform]
          const Icon = config.icon
          const displayName =
            link.username || extractUsername(link.url, link.platform)

          return (
            <Tooltip key={`${link.platform}-${index}`}>
              <TooltipTrigger asChild>
                <motion.div
                  variants={socialLinkVariants}
                  initial="rest"
                  whileHover="hover"
                  custom={index}
                >
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 transition-all",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("size-4", config.color)} />
                    <span className="text-sm font-medium">{displayName}</span>
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-sm">
                  Voir sur {config.label}
                </p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

// Compact version for smaller spaces
export const UserSocialLinksCompact = ({
  socialLinks,
  legacySocials,
}: UserSocialLinksProps) => {
  const links: SocialLink[] = socialLinks || []

  if (links.length === 0 && legacySocials && legacySocials.length > 0) {
    legacySocials.forEach((url) => {
      const platform = detectPlatform(url)
      links.push({ platform, url })
    })
  }

  if (links.length === 0) return null

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex gap-1.5">
        {links.map((link, index) => {
          const config = platformConfig[link.platform]
          const Icon = config.icon

          return (
            <Tooltip key={`${link.platform}-${index}`}>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg transition-all",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("size-4", config.color)} />
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-sm">{config.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
