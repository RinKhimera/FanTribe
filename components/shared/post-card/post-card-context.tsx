"use client"

import { createContext, use } from "react"
import { Doc } from "@/convex/_generated/dataModel"

export type ExtendedPost = Omit<Doc<"posts">, "author"> & {
  author: Doc<"users"> | null | undefined
  isPinned?: boolean
  isMediaLocked?: boolean
  mediaCount?: number
}

export type PostCardContextValue = {
  // Data
  post: ExtendedPost
  currentUser: Doc<"users">
  postUrl: string

  // Derived booleans
  isOwnPost: boolean
  canViewMedia: boolean
  isSubscriber: boolean

  // View configuration
  variant: "default" | "compact" | "featured"
  isDetailView: boolean

  // Comment section state
  isCommentsOpen: boolean
  toggleComments: () => void

  // Subscription modal
  openSubscriptionModal: () => void
}

export const PostCardContext = createContext<PostCardContextValue | null>(null)

export const usePostCard = () => {
  const context = use(PostCardContext)
  if (!context) {
    throw new Error("usePostCard must be used within PostCard")
  }
  return context
}

/** Returns null if no PostCard provider is present (for standalone usage) */
export const useOptionalPostCard = () => use(PostCardContext)
