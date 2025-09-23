"use client"

import { CreatePost } from "@/components/home/create-post"
import { NewsFeed } from "@/components/home/news-feed"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export const MainLayout = () => {
  const { currentUser } = useCurrentUser()
  const user = currentUser ?? undefined

  return (
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-[500px]:pb-16 max-lg:w-[80%] max-sm:w-full">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Accueil
      </h1>
      <CreatePost currentUser={user} />
      <NewsFeed currentUser={user} />
    </main>
  )
}
