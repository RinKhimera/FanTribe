"use client"

import TextareaAutosize from "react-textarea-autosize"
import { cn } from "@/lib/utils"
import { usePostComposer } from "./post-composer-context"

type PostComposerInputProps = {
  placeholder?: string
  maxLength?: number
}

export function PostComposerInput({
  placeholder = "Partagez quelque chose avec vos fans\u2026",
  maxLength = 400,
}: PostComposerInputProps) {
  const { state, actions } = usePostComposer()

  return (
    <div className="flex w-full flex-col">
      <TextareaAutosize
        placeholder={placeholder}
        className={cn(
          "w-full resize-none border-none bg-transparent",
          "placeholder:text-muted-foreground/50 text-lg",
          "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
        )}
        minRows={3}
        maxRows={12}
        value={state.content}
        onChange={(e) => actions.setContent(e.target.value)}
        aria-label="Contenu de la publication"
      />

      {/* Character count */}
      {state.content.length > 0 && (
        <div className="mt-2 flex justify-end">
          <span
            className={cn(
              "text-xs tabular-nums transition-colors duration-200",
              state.content.length > maxLength * 0.95
                ? "text-destructive font-medium"
                : state.content.length > maxLength * 0.75
                  ? "text-amber-500"
                  : "text-muted-foreground/50",
            )}
          >
            {state.content.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  )
}
