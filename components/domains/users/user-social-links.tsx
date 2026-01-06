"use client"

import { motion } from "motion/react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { socialLinkVariants } from "@/lib/animations"
import { extractUsername, type SocialPlatform } from "@/lib/social-links"
import { PLATFORM_CONFIG } from "@/lib/social-links/platform-config"
import { cn } from "@/lib/utils"

interface SocialLink {
  platform: SocialPlatform
  url: string
  username?: string
}

interface UserSocialLinksProps {
  socialLinks?: SocialLink[]
}

export const UserSocialLinks = ({ socialLinks }: UserSocialLinksProps) => {
  if (!socialLinks || socialLinks.length === 0) return null

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-2">
        {socialLinks.map((link, index) => {
          const config = PLATFORM_CONFIG[link.platform]
          const Icon = config.icon
          const displayName =
            link.username || extractUsername(link.url, link.platform) || config.label

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
                <p className="text-sm">Voir sur {config.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

// Compact version for smaller spaces (icon-only)
export const UserSocialLinksCompact = ({ socialLinks }: UserSocialLinksProps) => {
  if (!socialLinks || socialLinks.length === 0) return null

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex gap-1.5">
        {socialLinks.map((link, index) => {
          const config = PLATFORM_CONFIG[link.platform]
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
