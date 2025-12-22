import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export const useCurrentUser = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? undefined : "skip",
  )

  return {
    currentUser,
    isLoading: isAuthLoading || (isAuthenticated && currentUser === undefined),
    isAuthenticated,
  }
}
