import { fetchQuery } from "convex/nextjs"
import { redirect } from "next/navigation"

import { getAuthToken } from "@/app/auth"
import { SubscriptionsContent } from "@/components/domains/subscriptions/subscriptions-content"
import { api } from "@/convex/_generated/api"

export default async function SubscriptionsPage() {
  const token = await getAuthToken()

  const currentUser = await fetchQuery(
    api.users.getCurrentUser,
    undefined,
    { token },
  )

  if (!currentUser) {
    redirect("/sign-in")
  }

  return <SubscriptionsContent />
}
