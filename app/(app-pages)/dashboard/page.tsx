import { preloadQuery } from "convex/nextjs"
import { getAuthToken } from "@/app/auth"
import { OverviewContent } from "@/components/domains/dashboard/overview/overview-content"
import { api } from "@/convex/_generated/api"

export default async function DashboardOverviewPage() {
  const token = await getAuthToken()

  const [preloadedOverview, preloadedTrends] = await Promise.all([
    preloadQuery(api.dashboard.getDashboardOverview, undefined, { token }),
    preloadQuery(api.dashboard.getRevenueTrends, { months: 6 }, { token }),
  ])

  return (
    <OverviewContent
      preloadedOverview={preloadedOverview}
      preloadedTrends={preloadedTrends}
    />
  )
}
