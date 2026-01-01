"use client"

import { useQuery } from "convex/react"
import { Loader2 } from "lucide-react"
import { notFound } from "next/navigation"
import { use } from "react"
import {
  UserProfileHeader,
  UserProfileHero,
  UserProfileTabs,
} from "@/components/domains/users"
import { PageContainer } from "@/components/layout"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function UserProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = use(params)
  const { currentUser } = useCurrentUser()

  const userProfile = useQuery(api.users.getUserProfile, {
    username: username,
  })

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
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-4 text-sm">Chargement...</p>
        </div>
      </PageContainer>
    )
  }

  if (userProfile === null) notFound()

  return (
    <PageContainer hideHeader>
      <UserProfileHeader userProfile={userProfile} currentUser={currentUser} />
      <UserProfileHero
        currentUser={currentUser}
        userProfile={userProfile}
        subscriptionStatus={subscriptionStatus}
      />
      <UserProfileTabs username={username} />
      {children}
    </PageContainer>
  )
}
