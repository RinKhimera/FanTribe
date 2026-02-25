"use client"

import { usePaginatedQuery } from "convex/react"
import { FileText, Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { EmptyState } from "@/components/shared/empty-state"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"

const INITIAL_ITEMS = 20
const LOAD_MORE_ITEMS = 10

type PostWithAuthor = Doc<"posts"> & {
  author: Doc<"users"> | null | undefined
  isPinned?: boolean
}

export const UserPosts = ({
  authorId,
  currentUser,
}: {
  authorId: Id<"users">
  currentUser: Doc<"users"> | null | undefined
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getUserPostsWithPinned,
    { authorId },
    { initialNumItems: INITIAL_ITEMS },
  )

  // Intersection Observer pour le scroll infini
  useEffect(() => {
    if (!loadMoreRef.current || status !== "CanLoadMore") return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (firstEntry.isIntersecting && status === "CanLoadMore") {
          loadMore(LOAD_MORE_ITEMS)
        }
      },
      {
        threshold: 0.5,
        rootMargin: "200px",
      },
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [status, loadMore])

  // Premier chargement
  if (status === "LoadingFirstPage") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden="true" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement des posts…
        </p>
      </div>
    )
  }

  // Aucun post disponible
  if (results.length === 0 && status === "Exhausted") {
    return (
      <EmptyState
        icon={FileText}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        accentGradient="from-primary/20 via-transparent to-transparent"
        title="Aucune publication"
        description="Les publications apparaîtront ici"
      />
    )
  }

  return (
    <div className="flex flex-col">
      {(results as PostWithAuthor[]).map((post) => (
        <PostCard post={post} currentUser={currentUser!} key={post._id} />
      ))}

      {/* Élément déclencheur pour le chargement infini */}
      {status === "CanLoadMore" && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center justify-center py-8"
        >
          <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden="true" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement de plus de posts…
          </p>
        </div>
      )}

      {/* Chargement en cours */}
      {status === "LoadingMore" && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden="true" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement de plus de posts…
          </p>
        </div>
      )}

      {/* Message de fin */}
      {status === "Exhausted" && results.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            Vous avez tout vu ! 🎉
          </p>
        </div>
      )}
    </div>
  )
}
