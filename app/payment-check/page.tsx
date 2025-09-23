import { fetchQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { getAuthToken } from "@/app/auth"
import { PaymentCheckLayout } from "@/components/payment-check/payment-check-layout"
import { ResponsiveLayout } from "@/components/shared/responsive-layout"
import { api } from "@/convex/_generated/api"

const PaymentCheckPage = async () => {
  const token = await getAuthToken()
  const currentUser = await fetchQuery(api.users.getCurrentUser, undefined, {
    token,
  })

  if (!currentUser?.username) redirect("/onboarding")

  return (
    <ResponsiveLayout currentUser={currentUser}>
      <PaymentCheckLayout />
    </ResponsiveLayout>
  )
}

export default PaymentCheckPage
