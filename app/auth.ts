import { auth } from "@clerk/nextjs/server"
import { cache } from "react"

export const getAuthToken = cache(async () => {
  const { userId, getToken } = await auth()
  if (!userId) return undefined
  return (await getToken({ template: "convex" })) ?? undefined
})
