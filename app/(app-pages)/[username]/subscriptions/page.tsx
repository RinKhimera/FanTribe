"use client"

import { UserSubscriptionsList } from "@/components/domains/users/user-subscriptions-list"
import { useUserProfileContext } from "@/components/domains/users/user-profile-shell"

const UserSubscriptionsPage = () => {
  const ctx = useUserProfileContext()

  // Layout handles loading and not found states
  if (!ctx) return null

  return <UserSubscriptionsList userId={ctx.userProfile._id} />
}

export default UserSubscriptionsPage
