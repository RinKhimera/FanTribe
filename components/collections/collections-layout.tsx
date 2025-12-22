"use client"

import { Loader } from "lucide-react"
import { UserCollections } from "@/components/collections/user-collections"
import { PageContainer } from "@/components/layout"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export const CollectionsLayout = () => {
  const { currentUser } = useCurrentUser()

  if (!currentUser) {
    return (
      <PageContainer title="Collections">
        <div className="flex flex-1 flex-col items-center justify-center">
          <Loader className="text-primary animate-spin" size={60} />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Collections">
      <UserCollections currentUser={currentUser} />
    </PageContainer>
  )
}
