"use client"

import { CreatePost, NewsFeed } from "@/components/domains/posts"
import { PageContainer } from "@/components/layout"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export const MainLayout = () => {
  const { currentUser } = useCurrentUser()
  const user = currentUser ?? undefined

  return (
    <PageContainer title="Accueil">
      <CreatePost currentUser={user} />
      <NewsFeed currentUser={user} />
    </PageContainer>
  )
}
