"use client"

import { motion } from "motion/react"
import { Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Doc } from "@/convex/_generated/dataModel"
import { UserProfileBadgeInline } from "./user-profile-badges"

type UserProfileHeaderProps = {
  userProfile: Doc<"users">
  currentUser: Doc<"users"> | null | undefined
}

export const UserProfileHeader = ({
  userProfile,
  currentUser,
}: UserProfileHeaderProps) => {
  const isOwnProfile = currentUser?.username === userProfile.username

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="frosted sticky top-0 z-30 h-[53px] border-b border-white/10 px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <h1 className="flex items-center text-xl font-bold">
          {userProfile?.name}
          <UserProfileBadgeInline badges={userProfile.badges} />
        </h1>
        {isOwnProfile && (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="glass-button size-9 rounded-full"
          >
            <Link href={`/${currentUser?.username}/edit`}>
              <Settings className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </motion.header>
  )
}
