import { preloadQuery } from "convex/nextjs"
import { getAuthToken } from "@/app/auth"
import { ContentPerformance } from "@/components/domains/dashboard/content/content-performance"
import { api } from "@/convex/_generated/api"

export default async function DashboardContentPage() {
  const token = await getAuthToken()

  const [preloadedTopPosts, preloadedEngagement] = await Promise.all([
    preloadQuery(api.dashboard.getTopPosts, { limit: 10 }, { token }),
    preloadQuery(api.dashboard.getEngagementStats, undefined, { token }),
  ])

  return (
    <ContentPerformance
      preloadedTopPosts={preloadedTopPosts}
      preloadedEngagement={preloadedEngagement}
    />
  )
}
