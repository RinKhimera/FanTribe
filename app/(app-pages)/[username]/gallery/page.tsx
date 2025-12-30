"use client"

import { useQuery } from "convex/react"
import { use } from "react"
import { UserGallery } from "@/components/domains/users"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

const UserGalleryPage = ({
  params,
}: {
  params: Promise<{ username: string }>
}) => {
  const { username } = use(params)
  const { currentUser } = useCurrentUser()

  const userProfile = useQuery(api.users.getUserProfile, {
    username: username,
  })

  // Layout handles loading and not found states
  if (!userProfile || !currentUser) return null

  return <UserGallery authorId={userProfile._id} currentUser={currentUser} />
}

export default UserGalleryPage
