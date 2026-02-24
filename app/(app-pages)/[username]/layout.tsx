import { preloadQuery } from "convex/nextjs"
import { getAuthToken } from "@/app/auth"
import { UserProfileShell } from "@/components/domains/users/user-profile-shell"
import { api } from "@/convex/_generated/api"

export default async function UserProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const token = await getAuthToken()

  const [preloadedProfile, preloadedCurrentUser] = await Promise.all([
    preloadQuery(api.users.getUserProfile, { username }),
    preloadQuery(api.users.getCurrentUser, undefined, { token }),
  ])

  return (
    <UserProfileShell
      preloadedProfile={preloadedProfile}
      preloadedCurrentUser={preloadedCurrentUser}
      username={username}
    >
      {children}
    </UserProfileShell>
  )
}
