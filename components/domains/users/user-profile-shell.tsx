"use client"

import { Preloaded, usePreloadedQuery, useQuery } from "convex/react"
import { Loader2 } from "lucide-react"
import { notFound, usePathname } from "next/navigation"
import { createContext, use } from "react"
import { PageContainer } from "@/components/layout"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { UserProfileHeader } from "./user-profile-header"
import { UserProfileHero } from "./user-profile-hero"
import { UserProfileTabs } from "./user-profile-tabs"

type UserProfileContextValue = {
  userProfile: Doc<"users">
  currentUser: Doc<"users"> | null
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null)

export const useUserProfileContext = () => use(UserProfileContext)

type UserProfileShellProps = {
  preloadedProfile: Preloaded<typeof api.users.getUserProfile>
  preloadedCurrentUser: Preloaded<typeof api.users.getCurrentUser>
  username: string
  children: React.ReactNode
}

export function UserProfileShell({
  preloadedProfile,
  preloadedCurrentUser,
  username,
  children,
}: UserProfileShellProps) {
  const userProfile = usePreloadedQuery(preloadedProfile)
  const currentUser = usePreloadedQuery(preloadedCurrentUser)
  const pathname = usePathname()

  // Detect if we're on a post detail page or edit page
  const isPostPage = pathname.includes("/post/")
  const isEditPage = pathname.endsWith("/edit")

  const subscriptionStatus = useQuery(
    api.subscriptions.getFollowSubscription,
    userProfile && currentUser
      ? {
          creatorId: userProfile._id,
          subscriberId: currentUser._id,
        }
      : "skip",
  )

  if (userProfile === undefined) {
    return (
      <PageContainer hideHeader>
        <div className="flex h-screen flex-col items-center justify-center">
          <Loader2
            className="text-primary h-8 w-8 animate-spin"
            aria-hidden="true"
          />
          <p className="text-muted-foreground mt-4 text-sm">Chargement…</p>
        </div>
      </PageContainer>
    )
  }

  if (userProfile === null) notFound()

  // For post pages, render minimal container without profile components
  if (isPostPage) {
    return <PageContainer hideHeader>{children}</PageContainer>
  }

  return (
    <UserProfileContext.Provider
      value={{ userProfile, currentUser: currentUser ?? null }}
    >
      <PageContainer hideHeader>
        <UserProfileHeader
          userProfile={userProfile}
          currentUser={currentUser}
          isEditPage={isEditPage}
        />
        {!isEditPage && (
          <>
            <UserProfileHero
              currentUser={currentUser}
              userProfile={userProfile}
              subscriptionStatus={subscriptionStatus}
            />
            <UserProfileTabs username={username} />
          </>
        )}
        {children}
      </PageContainer>
    </UserProfileContext.Provider>
  )
}
