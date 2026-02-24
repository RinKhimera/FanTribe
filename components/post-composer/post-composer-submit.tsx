"use client"

import { LoaderCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePostComposer } from "./post-composer-context"

type PostComposerSubmitProps = {
  text?: string
  className?: string
}

export function PostComposerSubmit({
  text = "Publier",
  className,
}: PostComposerSubmitProps) {
  const { state, actions } = usePostComposer()

  const isDisabled = state.isPending || state.upload.isUploading

  return (
    <button
      type="button"
      onClick={actions.submit}
      disabled={isDisabled}
      className={cn(
        "btn-premium h-9 rounded-full px-5",
        "inline-flex items-center gap-1.5",
        "text-sm font-semibold tracking-wide",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {state.isPending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {text}
    </button>
  )
}
