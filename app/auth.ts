import { auth } from "@clerk/nextjs/server"
import { cache } from "react"

export const getAuthToken = cache(async () => {
  return (await (await auth()).getToken({ template: "convex" })) ?? undefined
})
