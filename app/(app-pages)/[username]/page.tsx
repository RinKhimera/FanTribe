"use client"

import { UserLikedPosts } from "@/components/domains/users/user-liked-posts"
import { UserPosts } from "@/components/domains/users"
import { useUserProfileContext } from "@/components/domains/users/user-profile-shell"

const UserProfilePage = () => {
  const ctx = useUserProfileContext()

  // Layout handles loading and not found states
  if (!ctx) return null

  const isCreator =
    ctx.userProfile.accountType === "CREATOR" ||
    ctx.userProfile.accountType === "SUPERUSER"

  if (isCreator) {
    return <UserPosts authorId={ctx.userProfile._id} currentUser={ctx.currentUser} />
  }

  return <UserLikedPosts userId={ctx.userProfile._id} currentUser={ctx.currentUser} />
}

export default UserProfilePage
