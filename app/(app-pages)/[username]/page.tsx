"use client"

import { useQuery } from "convex/react"
import { Loader2 } from "lucide-react"
import { notFound } from "next/navigation"
import { use } from "react"
import { UserProfileLayout } from "@/components/profile/user-profile-layout"
import { SubscriptionSidebar } from "@/components/shared/subscription-sidebar"
import { SuggestionSidebar } from "@/components/shared/suggestion-sidebar"
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

  // Vérifier si l'utilisateur peut être suivi
  const canSubscribeCheck = useQuery(
    api.subscriptions.canUserSubscribe,
    userProfile?._id ? { creatorId: userProfile._id } : "skip",
  )
  const canSubscribe = !!canSubscribeCheck?.canSubscribe
  // Variable reason disponible (cannotReason) pour gestion UI
  // const cannotReason = canSubscribeCheck?.reason

  if (userProfile === undefined) {
    return (
      <div className="border-muted flex h-screen w-[50%] flex-col items-center justify-center border-r border-l max-[500px]:pb-16 max-lg:w-[50%] max-sm:w-full">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">Chargement...</p>
      </div>
    )
  }

  if (userProfile === null) notFound()

  return (
    <>
      <UserProfileLayout currentUser={currentUser!} userProfile={userProfile} />

      <>
        {currentUser?.username !== userProfile.username && canSubscribe ? (
          <SubscriptionSidebar
            userProfile={userProfile}
            currentUserId={currentUser?._id}
          />
        ) : (
          <SuggestionSidebar />
        )}
      </>
    </>
  )
}

export default UserProfilePage
