"use client"

import { usePaginatedQuery } from "convex/react"
import { Heart, Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"

const INITIAL_ITEMS = 20
const LOAD_MORE_ITEMS = 10

type PostWithAuthor = Doc<"posts"> & {
  author: Doc<"users"> | null | undefined
}

export const UserLikedPosts = ({
  userId,
  currentUser,
}: {
  userId: Id<"users">
  currentUser: Doc<"users"> | null | undefined
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { results, status, loadMore } = usePaginatedQuery(
    api.likes.getUserLikedPostsPaginated,
    { userId },
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
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement…
        </p>
      </div>
    )
  }

  // Aucun j'aime
  if (results.length === 0 && status === "Exhausted") {
    return (
      <div className="mt-16 flex h-full flex-col items-center px-4 text-center">
        <Heart className="text-muted-foreground/50 mb-4 size-12" />
        <p className="text-muted-foreground text-xl">
          Aucun j&apos;aime pour le moment
        </p>
      </div>
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
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement…
          </p>
        </div>
      )}

      {/* Chargement en cours */}
      {status === "LoadingMore" && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement…
          </p>
        </div>
      )}

      {/* Message de fin */}
      {status === "Exhausted" && results.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            Vous avez tout vu !
          </p>
        </div>
      )}
    </div>
  )
}
