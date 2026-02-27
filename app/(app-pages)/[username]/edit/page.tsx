import { fetchQuery } from "convex/nextjs"
import { notFound, redirect } from "next/navigation"
import { getAuthToken } from "@/app/auth"
import { EditProfileLayout } from "@/components/domains/users"
import { api } from "@/convex/_generated/api"

const EditProfile = async (props: {
  params: Promise<{ username: string }>
}) => {
  const params = await props.params
  const token = await getAuthToken()

  // Parallel fetch: getCurrentUser and getUserProfile are independent
  const [currentUser, userProfile] = await Promise.all([
    fetchQuery(api.users.getCurrentUser, undefined, { token }),
    fetchQuery(api.users.getUserProfile, { username: params.username }, { token }),
  ])

  if (!currentUser?.username) redirect("/onboarding")
  if (userProfile === null) notFound()

  // Dependent query: needs both currentUser and userProfile
  const subscriptionStatus = await fetchQuery(
    api.subscriptions.getFollowSubscription,
    {
      creatorId: userProfile._id,
      subscriberId: currentUser._id,
    },
    { token },
  )

  return (
    <EditProfileLayout
      currentUser={currentUser}
      userProfile={userProfile}
      subStatus={subscriptionStatus}
    />
  )
}

export default EditProfile
