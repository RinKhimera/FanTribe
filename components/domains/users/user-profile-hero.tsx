"use client"

import { motion } from "motion/react"
import { Coins, MapPin, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useState } from "react"
import { SubscriptionButton } from "@/components/domains/subscriptions"
import { TipDialog } from "@/components/domains/tips"
import { MediaLightbox } from "@/components/shared/media-lightbox"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import {
  UserProfileBadgeInline,
  UserProfileBadges,
} from "./user-profile-badges"
import { UserProfileStats } from "./user-profile-stats"
import { UserReportButton } from "./user-report-button"
import { UserSocialLinks } from "./user-social-links"

type FollowSubscriptionStatus = {
  status: "pending" | "active" | "canceled" | "expired"
}

type UserProfileHeroProps = {
  currentUser: Doc<"users"> | null | undefined
  userProfile: Doc<"users">
  subscriptionStatus: FollowSubscriptionStatus | null | undefined
}

export const UserProfileHero = ({
  currentUser,
  userProfile,
  subscriptionStatus,
}: UserProfileHeroProps) => {
  const isOwnProfile = currentUser?.username === userProfile.username
  const isCreator = userProfile.accountType === "CREATOR" || userProfile.accountType === "SUPERUSER"

  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false)

  const openAvatar = useCallback(() => {
    if (!userProfile.image) return
    setAvatarViewerOpen(true)
  }, [userProfile.image])

  return (
    <>
      {/* Banner */}
      <div className="relative">
        <AspectRatio ratio={3 / 1} className="bg-muted">
          <Image
            src={
              (userProfile?.imageBanner as string) ||
              "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
            }
            alt={userProfile?.name as string}
            className="object-cover"
            fill
            priority
          />
        </AspectRatio>
      </div>

      {/* Profile info section */}
      <div className="relative px-4">
        {/* Avatar - positioned to overlap banner */}
        <div className="-mt-12 mb-3 flex items-end justify-between sm:-mt-16">
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            type="button"
            onClick={openAvatar}
            className={cn(
              "rounded-full outline-none focus-visible:ring-ring focus-visible:ring-2",
              isCreator && "ring-2 ring-primary/50 shadow-[0_0_15px_oklch(0.541_0.281_293/0.3)]",
            )}
          >
            <Avatar className="border-background size-24 cursor-pointer border-4 transition hover:brightness-110 sm:size-28">
              {userProfile?.image ? (
                <AvatarImage
                  src={userProfile.image}
                  sizes="128px"
                  className="object-cover"
                  alt={userProfile?.name || "Profile image"}
                />
              ) : (
                <AvatarFallback className="bg-muted text-3xl">
                  {userProfile?.name?.charAt(0) || "?"}
                </AvatarFallback>
              )}
            </Avatar>
          </motion.button>

          {/* Action button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="pb-1"
          >
            {isOwnProfile ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full px-4"
              >
                <Link href={`/${currentUser?.username}/edit`}>
                  Modifier le profil
                </Link>
              </Button>
            ) : (
              <UserReportButton
                userId={userProfile._id}
                username={userProfile.username}
              />
            )}
          </motion.div>
        </div>

        {/* Name and username */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-2"
        >
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold">{userProfile?.name}</h2>
            <UserProfileBadgeInline badges={userProfile.badges} />
          </div>
          <p className="text-muted-foreground text-sm">@{userProfile?.username}</p>
        </motion.div>

        {/* Bio */}
        {userProfile?.bio && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-foreground/90 mb-2 text-sm leading-relaxed"
          >
            {userProfile.bio}
          </motion.p>
        )}

        {/* Location */}
        {userProfile?.location && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm"
          >
            <MapPin className="size-3.5" />
            <span>{userProfile.location}</span>
          </motion.div>
        )}

        {/* Stats inline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-3"
        >
          <UserProfileStats userId={userProfile._id} />
        </motion.div>

        {/* Badges */}
        {userProfile.badges && userProfile.badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mb-3"
          >
            <UserProfileBadges badges={userProfile.badges} size="sm" />
          </motion.div>
        )}

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <UserSocialLinks socialLinks={userProfile.socialLinks} />
        </motion.div>

        {/* Subscription section */}
        {!isOwnProfile && userProfile.accountType === "CREATOR" && (
          <div className="mb-4">
            <SubscriptionButton
              userProfile={userProfile}
              subscriptionStatus={subscriptionStatus}
            />
          </div>
        )}

        {/* Tip button */}
        {!isOwnProfile && userProfile.accountType === "CREATOR" && (
          <div className="mb-4">
            <TipDialog
              creator={userProfile}
              context="profile"
              trigger={
                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
                >
                  <Coins className="mr-2 size-4" />
                  Envoyer un pourboire
                </Button>
              }
            />
          </div>
        )}

        {/* Become creator CTA — own profile, USER only */}
        {isOwnProfile && !isCreator && (
          <div className="mb-4">
            <Button
              asChild
              className="w-full rounded-2xl bg-linear-to-r from-primary to-purple-600 text-white hover:opacity-90"
            >
              <Link href="/be-creator">
                <Sparkles className="mr-2 size-4" />
                Devenir créateur
              </Link>
            </Button>
          </div>
        )}

      </div>

      {/* Fullscreen avatar viewer */}
      <MediaLightbox
        slides={userProfile?.image ? [{ src: userProfile.image }] : []}
        index={0}
        open={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
      />
    </>
  )
}
