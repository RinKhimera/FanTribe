"use client"

import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

type ImageLoadingStatus = "idle" | "loaded" | "error"

const AvatarContext = React.createContext<{
  status: ImageLoadingStatus
  onStatusChange: (status: ImageLoadingStatus) => void
}>({ status: "idle", onStatusChange: () => {} })

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  ref?: React.Ref<HTMLSpanElement>
}

const Avatar = ({ className, ref, ...props }: AvatarProps) => {
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
}

interface AvatarImageProps {
  src?: string
  alt?: string
  sizes?: string
  className?: string
  ref?: React.Ref<HTMLImageElement>
}

const AvatarImage = ({ src, alt = "", sizes = "96px", className, ref }: AvatarImageProps) => {
  const { onStatusChange } = React.use(AvatarContext)

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
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  ref?: React.Ref<HTMLSpanElement>
}

const AvatarFallback = ({ className, ref, ...props }: AvatarFallbackProps) => {
  const { status } = React.use(AvatarContext)

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
}

export { Avatar, AvatarImage, AvatarFallback }
