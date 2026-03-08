"use client"

import { useQuery } from "convex/react"
import { Cookie, Crown, FileText, Heart, Shield, Users } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { FollowButton } from "@/components/domains/users/follow-button"
import { UserProfileBadgeInline } from "@/components/domains/users/user-profile-badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

const legalLinks = [
  { href: "/terms", label: "Conditions", icon: FileText },
  { href: "/privacy", label: "Confidentialité", icon: Shield },
  { href: "/cookies", label: "Cookies", icon: Cookie },
]

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

const creatorItemVariants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-2">
    <div className="bg-muted/20 size-10 shrink-0 animate-pulse rounded-full" />
    <div className="flex-1 space-y-1.5">
      <div className="bg-muted/20 h-3.5 w-24 animate-pulse rounded" />
      <div className="bg-muted/20 h-3 w-16 animate-pulse rounded" />
    </div>
  </div>
)

export const ExploreSidebar = () => {
  const popularCreators = useQuery(api.users.getPopularCreators)
  const isLoading = popularCreators === undefined

  return (
    <motion.div
      className="mt-3 space-y-5"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Section : Créateurs populaires */}
      <motion.div variants={itemVariants}>
        <div className="glass-card overflow-hidden rounded-xl">
          {/* Header */}
          <div className="border-border/40 flex items-center gap-2 border-b px-4 py-3">
            <Crown className="size-4 text-[var(--gold-400)]" />
            <h3 className="text-sm font-semibold">Créateurs populaires</h3>
          </div>

          {/* Creator list */}
          <div className="p-3">
            {isLoading ? (
              <div className="space-y-1">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : popularCreators.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Aucun créateur pour le moment
              </p>
            ) : (
              <motion.div
                className="space-y-1"
                variants={containerVariants}
                initial="initial"
                animate="animate"
              >
                {popularCreators.map(
                  ({ user, followersCount, postsCount }, index) => (
                    <motion.div
                      key={user._id}
                      variants={creatorItemVariants}
                      className="group"
                    >
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2 py-2",
                          "hover:bg-muted/30 transition-colors duration-200",
                        )}
                      >
                        {/* Rank number */}
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            index === 0
                              ? "bg-[var(--gold-400)] text-[oklch(0.15_0.02_60)]"
                              : index === 1
                                ? "bg-muted/60 text-foreground"
                                : index === 2
                                  ? "bg-[oklch(0.6_0.1_50)] text-white"
                                  : "text-muted-foreground",
                          )}
                        >
                          {index + 1}
                        </span>

                        {/* Avatar + link */}
                        <Link
                          href={`/${user.username}`}
                          className="flex min-w-0 flex-1 items-center gap-2.5"
                        >
                          <Avatar className="ring-border/50 size-9 ring-1">
                            <AvatarImage
                              src={user.image}
                              alt={user.name || ""}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold">
                              {user.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="group-hover:text-primary truncate text-sm leading-tight font-semibold">
                                {user.name || "Créateur"}
                              </p>
                              <UserProfileBadgeInline
                                accountType={user.accountType}
                              />
                            </div>
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-0.5">
                                <Users className="size-3" />
                                {followersCount}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Heart className="size-3" />
                                {postsCount}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Follow button */}
                        <FollowButton
                          targetUserId={user._id}
                          variant="compact"
                        />
                      </div>
                    </motion.div>
                  ),
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Legal Links */}
      <motion.div
        variants={itemVariants}
        className="border-border/40 border-t pt-4"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {legalLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5",
                  "text-muted-foreground text-xs",
                  "hover:text-primary transition-colors duration-200",
                )}
              >
                <Icon className="h-3 w-3" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
