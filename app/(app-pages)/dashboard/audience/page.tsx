import { preloadQuery } from "convex/nextjs"
import { getAuthToken } from "@/app/auth"
import { AudienceContent } from "@/components/domains/dashboard/audience/audience-content"
import { api } from "@/convex/_generated/api"

export default async function DashboardAudiencePage() {
  const token = await getAuthToken()

  const [preloadedGrowth, preloadedSubscribers] = await Promise.all([
    preloadQuery(
      api.dashboard.getSubscriberGrowth,
      { months: 6 },
      { token },
    ),
    preloadQuery(
      api.subscriptions.getMySubscribersStats,
      undefined,
      { token },
    ),
  ])

  // Server component — Date.now() is stable (runs once per request)
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()

  return (
    <AudienceContent
      preloadedGrowth={preloadedGrowth}
      preloadedSubscribers={preloadedSubscribers}
      now={now}
    />
  )
}
