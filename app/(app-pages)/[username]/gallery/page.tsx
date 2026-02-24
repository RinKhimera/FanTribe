"use client"

import { UserGallery } from "@/components/domains/users"
import { useUserProfileContext } from "@/components/domains/users/user-profile-shell"

const UserGalleryPage = () => {
  const ctx = useUserProfileContext()

  // Layout handles loading and not found states
  if (!ctx?.currentUser) return null

  return (
    <UserGallery authorId={ctx.userProfile._id} currentUser={ctx.currentUser} />
  )
}

export default UserGalleryPage
