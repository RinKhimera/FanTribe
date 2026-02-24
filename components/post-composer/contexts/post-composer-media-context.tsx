"use client"

import { createContext, use } from "react"
import type { PostComposerMediaContextValue } from "../types"

export const PostComposerMediaContext =
  createContext<PostComposerMediaContextValue | null>(null)

export const usePostComposerMedia = () => {
  const context = use(PostComposerMediaContext)
  if (!context) {
    throw new Error(
      "usePostComposerMedia must be used within PostComposerProvider",
    )
  }
  return context
}
