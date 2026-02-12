"use client"

import { UserPosts } from "@/components/domains/users"
import { useUserProfileContext } from "@/components/domains/users/user-profile-shell"

const UserProfilePage = () => {
  const ctx = useUserProfileContext()

  // Layout handles loading and not found states
  if (!ctx) return null

  return <UserPosts authorId={ctx.userProfile._id} currentUser={ctx.currentUser} />
}

export default UserProfilePage
