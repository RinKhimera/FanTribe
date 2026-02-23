"use client"

import { Settings } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Doc } from "@/convex/_generated/dataModel"
import { UserProfileBadgeInline } from "./user-profile-badges"

type UserProfileHeaderProps = {
  userProfile: Doc<"users">
  currentUser: Doc<"users"> | null | undefined
  isEditPage?: boolean
}

export const UserProfileHeader = ({
  userProfile,
  currentUser,
  isEditPage = false,
}: UserProfileHeaderProps) => {
  const isOwnProfile = currentUser?.username === userProfile.username

  return (
    <div className="sticky top-0 z-30">
      <PageHeader
        className="h-[53px] min-h-[53px]"
        rightAction={
          isOwnProfile && !isEditPage && (
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
          )
        }
      >
        <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
          {userProfile?.name}
          <UserProfileBadgeInline badges={userProfile.badges} />
        </h1>
      </PageHeader>
    </div>
  )
}
