"use client"

import { useQuery } from "convex/react"
import { Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"

type PostWithAuthor = Doc<"posts"> & {
  author: Doc<"users"> | null | undefined
}

export const NewsFeed = ({
  currentUser,
}: {
  currentUser: Doc<"users"> | undefined
}) => {
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const result = useQuery(
    api.posts.getHomePosts,
    currentUser
      ? {
          paginationOpts: {
            numItems: 20,
            cursor,
          },
        }
      : "skip",
  )

  // Ajouter les nouveaux posts à la liste
  useEffect(() => {
    if (result?.posts) {
      setAllPosts((prev) => {
        // Éviter les doublons en vérifiant les IDs
        const existingIds = new Set(prev.map((p) => p._id))
        const newPosts = result.posts.filter((p) => !existingIds.has(p._id))
        return [...prev, ...newPosts] as PostWithAuthor[]
      })
      setIsLoadingMore(false)
      setHasInitiallyLoaded(true)
    }
  }, [result])

  // Intersection Observer pour détecter le scroll
  useEffect(() => {
    if (!loadMoreRef.current || !result) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (
          firstEntry.isIntersecting &&
          !result.isDone &&
          !isLoadingMore &&
          result.continueCursor
        ) {
          setIsLoadingMore(true)
          setCursor(result.continueCursor)
        }
      },
      {
        threshold: 0.4,
        rootMargin: "200px",
      },
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [result, isLoadingMore])

  // Afficher un loader si currentUser n'est pas encore défini
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement du fil d&apos;actualité...
        </p>
      </div>
    )
  }

  // Afficher un loader UNIQUEMENT au premier chargement (pas les suivants)
  if (result === undefined && !hasInitiallyLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement des publications...
        </p>
      </div>
    )
  }

  // Afficher un message si aucun post n'est disponible
  if (allPosts.length === 0 && result?.isDone) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg font-medium">
          Aucune publication disponible
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Suivez des créateurs pour voir leurs publications ici
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {allPosts.map((post) => (
        <PostCard post={post} currentUser={currentUser} key={post._id} />
      ))}

      {/* Élément déclencheur pour le chargement infini */}
      {result && !result.isDone && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center justify-center py-8"
        >
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement de plus de publications...
          </p>
        </div>
      )}

      {/* Message de fin */}
      {result && result.isDone && allPosts.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            Vous avez tout vu ! 🎉
          </p>
        </div>
      )}
    </div>
  )
}
