import { preloadQuery } from "convex/nextjs"
import { getAuthToken } from "@/app/auth"
import { RevenueContent } from "@/components/domains/dashboard/revenue/revenue-content"
import { api } from "@/convex/_generated/api"

export default async function DashboardRevenuePage() {
  const token = await getAuthToken()

  const [preloadedEarnings, preloadedTips, preloadedTrends] =
    await Promise.all([
      preloadQuery(
        api.transactions.getCreatorEarnings,
        undefined,
        { token },
      ),
      preloadQuery(
        api.tips.getCreatorTipEarnings,
        undefined,
        { token },
      ),
      preloadQuery(
        api.dashboard.getRevenueTrends,
        { months: 12 },
        { token },
      ),
    ])

  return (
    <RevenueContent
      preloadedEarnings={preloadedEarnings}
      preloadedTips={preloadedTips}
      preloadedTrends={preloadedTrends}
    />
  )
}
