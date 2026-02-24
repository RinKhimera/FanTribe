"use client"

import { createContext, use } from "react"
import type { PostComposerFormContextValue } from "../types"

export const PostComposerFormContext =
  createContext<PostComposerFormContextValue | null>(null)

export const usePostComposerForm = () => {
  const context = use(PostComposerFormContext)
  if (!context) {
    throw new Error(
      "usePostComposerForm must be used within PostComposerProvider",
    )
  }
  return context
}
