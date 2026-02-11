"use client"

import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

type ImageLoadingStatus = "idle" | "loaded" | "error"

const AvatarContext = React.createContext<{
  status: ImageLoadingStatus
  onStatusChange: (status: ImageLoadingStatus) => void
}>({ status: "idle", onStatusChange: () => {} })

const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const [status, setStatus] = React.useState<ImageLoadingStatus>("idle")
  return (
    <AvatarContext.Provider value={{ status, onStatusChange: setStatus }}>
      <span
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  {
    src?: string
    alt?: string
    sizes?: string
    className?: string
  }
>(({ src, alt = "", sizes = "96px", className }, ref) => {
  const { onStatusChange } = React.useContext(AvatarContext)

  if (!src) return null

  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onLoad={() => onStatusChange("loaded")}
      onError={() => onStatusChange("error")}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const { status } = React.useContext(AvatarContext)

  if (status === "loaded") return null

  return (
    <span
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
