import { fetchQuery, preloadQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { getAuthToken } from "@/app/auth"
import { IncomeContent } from "@/components/domains/income/income-content"
import { api } from "@/convex/_generated/api"

const IncomePage = async () => {
  const token = await getAuthToken()
  const currentUser = await fetchQuery(
    api.users.getCurrentUser,
    undefined,
    { token },
  )

  // Guard côté serveur — redirect les non-créateurs
  if (
    !currentUser ||
    (currentUser.accountType !== "CREATOR" &&
      currentUser.accountType !== "SUPERUSER")
  ) {
    redirect("/")
  }

  const [preloadedEarnings, preloadedTips] = await Promise.all([
    preloadQuery(api.transactions.getCreatorEarnings, undefined, { token }),
    preloadQuery(api.tips.getCreatorTipEarnings, undefined, { token }),
  ])

  return (
    <IncomeContent
      preloadedEarnings={preloadedEarnings}
      preloadedTips={preloadedTips}
    />
  )
}

export default IncomePage
