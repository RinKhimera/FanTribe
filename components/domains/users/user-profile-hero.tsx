"use client"

import { motion } from "motion/react"
import { MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useState } from "react"
import { SubscriptionButton } from "@/components/domains/subscriptions"
import { FullscreenImageViewer } from "@/components/shared/fullscreen-image-viewer"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Doc } from "@/convex/_generated/dataModel"
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
            className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2"
          >
            <Avatar className="border-background size-24 cursor-pointer border-4 transition hover:brightness-110 sm:size-28">
              {userProfile?.image ? (
                <AvatarImage
                  src={userProfile.image}
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

      </div>

      {/* Fullscreen avatar viewer */}
      <FullscreenImageViewer
        medias={userProfile?.image ? [userProfile.image] : []}
        index={0}
        open={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
      />
    </>
  )
}
