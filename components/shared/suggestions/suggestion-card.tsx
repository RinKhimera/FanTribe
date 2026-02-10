"use client"

import { motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { UserProps } from "@/types"

interface SuggestionCardProps {
  user: NonNullable<UserProps>
  searchTerm?: string
  variant?: "default" | "compact"
  index?: number
}

const cardVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: index * 0.08,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: 0.2 },
  },
}

export const SuggestionCard = ({
  user,
  searchTerm,
  variant = "default",
  index = 0,
}: SuggestionCardProps) => {
  // Pre-compile RegExp to avoid re-creation on each call
  const searchRegex = useMemo(() => {
    if (!searchTerm) return null
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return new RegExp(`(${escaped})`, "gi")
  }, [searchTerm])

  const highlightText = (text: string) => {
    if (!searchRegex) return text
    const parts = text.split(searchRegex)
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm!.toLowerCase() ? (
        <mark
          key={i}
          className="bg-primary/30 rounded-sm px-0.5 font-semibold text-white"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const isCompact = variant === "compact"
  const cardHeight = isCompact ? "h-[100px]" : "h-[140px]"
  const avatarSize = isCompact ? "h-14 w-14" : "h-20 w-20"
  const contentOffset = isCompact ? "ml-[70px]" : "ml-[100px]"

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={index}
    >
      <Link
        href={`/${user.username}`}
        className={cn("relative block overflow-hidden rounded-xl", cardHeight)}
      >
        {/* Banner Image */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={
              user.imageBanner ||
              "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
            }
            alt=""
            fill
            className="object-cover"
          />

          {/* Multi-layer gradient overlay for depth */}
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-linear-to-r from-black/30 via-transparent to-transparent" />
        </div>

        {/* Avatar */}
        <div className="absolute top-1/2 left-4 z-10 -translate-y-1/2">
          <Avatar className={cn(avatarSize, "shadow-2xl ring-2 ring-white/20")}>
            <AvatarImage
              src={user.image}
              alt={user.name || "User"}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/30 text-lg font-bold text-white">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          {/* Online indicator */}
          {user.isOnline && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute right-0.5 bottom-0.5 z-20",
                "h-4 w-4 rounded-full",
                "bg-emerald-500 ring-2 ring-black/50",
                "shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]",
              )}
            />
          )}
        </div>

        {/* User info */}
        <div
          className={cn("absolute inset-0 flex items-end p-4", contentOffset)}
        >
          <div className="flex min-w-0 flex-col justify-end space-y-0.5">
            <h4 className="truncate text-[15px] leading-tight font-semibold text-white drop-shadow-md">
              {highlightText(user.name || "Utilisateur")}
            </h4>
            <p className="truncate text-sm font-medium text-white/60">
              @{highlightText(user.username || "")}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
