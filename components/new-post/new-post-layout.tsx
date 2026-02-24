"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PageContainer } from "@/components/layout/page-container"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks"
import {
  PostComposerProvider,
  PostComposerFrame,
  PostComposerInput,
  PostComposerMedia,
  PostComposerActions,
  PostComposerSubmit,
} from "@/components/post-composer"

const MAX_MEDIA = 3

export const NewPostLayout = () => {
  const router = useRouter()
  const { currentUser, isLoading } = useCurrentUser()

  useEffect(() => {
    if (!isLoading && currentUser?.accountType === "USER") {
      router.push("/")
    }
  }, [isLoading, currentUser?.accountType, router])

  if (isLoading || !currentUser) return null
  if (currentUser.accountType === "USER") return null

  const BackButton = (
    <Button variant="ghost" size="icon" className="hover:bg-primary/10 size-9 rounded-full" asChild>
      <Link href="/">
        <ArrowLeft className="size-5" />
      </Link>
    </Button>
  )

  return (
    <PageContainer title="Nouvelle publication" headerLeftAction={BackButton}>
      <PostComposerProvider
        config={{
          userId: currentUser._id,
          maxMedia: MAX_MEDIA,
          onSuccess: () => router.push("/"),
        }}
      >
        <PostComposerFrame>
          <div className="flex items-start gap-4">
            <Avatar className="ring-background size-12 shrink-0 ring-2">
              <AvatarImage src={currentUser.image} alt={currentUser.username || "Profile image"} />
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                {currentUser.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <PostComposerInput />
              <PostComposerMedia />

              <div className="my-5 h-px bg-linear-to-r from-transparent via-border to-transparent" />

              <div className="flex items-center justify-between">
                <PostComposerActions />
                <PostComposerSubmit />
              </div>
            </div>
          </div>
        </PostComposerFrame>
      </PostComposerProvider>
    </PageContainer>
  )
}
