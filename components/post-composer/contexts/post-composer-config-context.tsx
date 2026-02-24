"use client"

import { createContext, use } from "react"
import type { PostComposerConfig } from "../types"

export const PostComposerConfigContext =
  createContext<PostComposerConfig | null>(null)

export const usePostComposerConfig = () => {
  const context = use(PostComposerConfigContext)
  if (!context) {
    throw new Error(
      "usePostComposerConfig must be used within PostComposerProvider",
    )
  }
  return context
}
