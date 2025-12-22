import { fetchQuery } from "convex/nextjs"
import { notFound, redirect } from "next/navigation"
import { getAuthToken } from "@/app/auth"
import { UserGalleryLayout } from "@/components/domains/users"
import { api } from "@/convex/_generated/api"

const UserGalleryPage = async (props: {
  params: Promise<{ username: string }>
}) => {
  const params = await props.params
  const token = await getAuthToken()
  const currentUser = await fetchQuery(api.users.getCurrentUser, undefined, {
    token,
  })

  if (!currentUser?.username) redirect("/onboarding")

  const userProfile = await fetchQuery(api.users.getUserProfile, {
    username: params.username,
  })

  if (userProfile === null) notFound()

  return (
    <UserGalleryLayout currentUser={currentUser} userProfile={userProfile} />
  )
}

export default UserGalleryPage
