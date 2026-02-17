import { fetchQuery, preloadQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { getAuthToken } from "@/app/auth"
import { DashboardShell } from "@/components/domains/dashboard/dashboard-shell"
import { api } from "@/convex/_generated/api"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = await getAuthToken()

  const currentUser = await fetchQuery(
    api.users.getCurrentUser,
    undefined,
    { token },
  )

  // Guard: créateurs et superusers uniquement
  if (
    !currentUser ||
    (currentUser.accountType !== "CREATOR" &&
      currentUser.accountType !== "SUPERUSER")
  ) {
    redirect("/")
  }

  const preloadedUser = await preloadQuery(
    api.users.getCurrentUser,
    undefined,
    { token },
  )

  return (
    <DashboardShell preloadedUser={preloadedUser}>
      {children}
    </DashboardShell>
  )
}
