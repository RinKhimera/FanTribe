"use client"

import { useQuery } from "convex/react"
import { use } from "react"
import { UserPosts } from "@/components/domains/users"
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

  // Layout handles loading and not found states
  if (!userProfile) return null

  return <UserPosts authorId={userProfile._id} currentUser={currentUser} />
}

export default UserProfilePage
