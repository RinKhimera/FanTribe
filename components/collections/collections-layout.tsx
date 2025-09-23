"use client"

import { Loader } from "lucide-react"
import { UserCollections } from "@/components/collections/user-collections"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export const CollectionsLayout = () => {
  const { currentUser } = useCurrentUser()

  if (!currentUser)
    return (
      <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-[500px]:pb-16 max-lg:w-[80%] max-sm:w-full">
        <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
          Collections
        </h1>

        <div className="flex flex-1 flex-col items-center justify-center">
          <Loader className="text-primary animate-spin" size={60} />
        </div>
      </main>
    )

  return (
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-[500px]:pb-16 max-lg:w-[80%] max-sm:w-full">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Collections
      </h1>

      <UserCollections currentUser={currentUser} />
    </main>
  )
}
