import { fetchQuery, preloadQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { getAuthToken } from "@/app/auth"
import { AccountShell } from "@/components/domains/account/account-shell"
import { api } from "@/convex/_generated/api"

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = await getAuthToken()

  // Auth guard - redirect to sign-in if not authenticated
  const currentUser = await fetchQuery(
    api.users.getCurrentUser,
    undefined,
    { token },
  )

  if (!currentUser) {
    redirect("/sign-in")
  }

  // Preload user data for client components
  const preloadedUser = await preloadQuery(
    api.users.getCurrentUser,
    undefined,
    { token },
  )

  return (
    <AccountShell preloadedUser={preloadedUser}>{children}</AccountShell>
  )
}
