"use client"

import { CreatePost } from "@/components/home/create-post"
import { NewsFeed } from "@/components/home/news-feed"
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
