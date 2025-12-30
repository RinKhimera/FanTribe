"use client"

import Link from "next/link"
import React, { useState } from "react"
import { cn } from "@/lib/utils"

type PostContentProps = {
  content: string
  /** Nombre max de lignes avant troncature */
  maxLines?: number
}

export const PostContent = ({ content, maxLines = 6 }: PostContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Diviser le contenu en lignes non vides
  const lines = content.split("\n").filter((line) => line.trim() !== "")
  const shouldTruncate = lines.length > maxLines && !isExpanded
  const displayedLines = shouldTruncate ? lines.slice(0, maxLines) : lines

  // Détecter les URLs et mentions
  const formatLine = (line: string, index: number) => {
    // Pattern pour les URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g
    // Pattern pour les mentions @username
    const mentionPattern = /(@\w+)/g
    // Pattern pour les hashtags
    const hashtagPattern = /(#\w+)/g

    // Séparer par URLs d'abord
    const parts = line.split(urlPattern)

    return (
      <React.Fragment key={index}>
        {parts.map((part, partIndex) => {
          if (part.match(urlPattern)) {
            return (
              <a
                key={partIndex}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary break-all hover:text-primary/80 hover:underline transition-colors"
              >
                {part}
              </a>
            )
          }

          // Traiter les mentions dans le reste du texte
          const mentionParts = part.split(mentionPattern)
          return mentionParts.map((mentionPart, mentionIndex) => {
            if (mentionPart.match(mentionPattern)) {
              const username = mentionPart.slice(1)
              return (
                <Link
                  key={`${partIndex}-${mentionIndex}`}
                  href={`/${username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium"
                >
                  {mentionPart}
                </Link>
              )
            }

            // Traiter les hashtags
            const hashtagParts = mentionPart.split(hashtagPattern)
            return hashtagParts.map((hashtagPart, hashtagIndex) => {
              if (hashtagPart.match(hashtagPattern)) {
                return (
                  <span
                    key={`${partIndex}-${mentionIndex}-${hashtagIndex}`}
                    className="text-primary cursor-pointer hover:text-primary/80 transition-colors"
                  >
                    {hashtagPart}
                  </span>
                )
              }
              return hashtagPart
            })
          })
        })}
        {index < displayedLines.length - 1 && <br />}
      </React.Fragment>
    )
  }

  return (
    <div className="px-4">
      <div
        className={cn(
          "text-foreground text-[15px] leading-[1.65] whitespace-pre-wrap",
          "wrap-break-word tracking-[0.01em]",
        )}
      >
        {displayedLines.map((line, index) => formatLine(line, index))}

        {shouldTruncate && (
          <>
            <span className="text-muted-foreground/60">...</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="ml-1.5 font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Voir plus
            </button>
          </>
        )}

        {isExpanded && lines.length > maxLines && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(false)
            }}
            className="text-muted-foreground/70 ml-1.5 text-sm hover:text-primary transition-colors"
          >
            Réduire
          </button>
        )}
      </div>
    </div>
  )
}
