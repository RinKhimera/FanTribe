"use client"

import { useQuery } from "convex/react"
import { Loader2 } from "lucide-react"
import { notFound } from "next/navigation"
import { use } from "react"
import { PageContainer } from "@/components/layout"
import { UserProfileLayout } from "@/components/profile/user-profile-layout"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

const UserProfilePage = ({
  params,
}: {
  params: Promise<{ username: string }>
}) => {
  const { username } = use(params)
  const { currentUser } = useCurrentUser()

  const userProfile = useQuery(api.users.getUserProfile, {
    username: username,
  })

  // La logique de l'abonnement/suggestions est désormais gérée par RightSidebar

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
    <UserProfileLayout currentUser={currentUser!} userProfile={userProfile} />
  )
}

export default UserProfilePage
