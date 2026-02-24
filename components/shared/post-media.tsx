"use client"

import Image from "next/image"
import React, { useState } from "react"
import { MediaLightbox } from "@/components/shared/media-lightbox"
import { useVideoMetadata } from "@/hooks"
import {
  getOptimalDisplayRatio,
  getVideoDisplayInfo,
} from "@/lib/calculators/video-display-info"
import { cn } from "@/lib/utils"
import type { PostMedia as PostMediaType } from "@/types"
import { BunnyVideoPlayer } from "./bunny-video-player"
import { LockedContentOverlay } from "./post-media/locked-content-overlay"

// ============================================================================
// Constants
// ============================================================================

const RATIO_MIN = 4 / 5 // 0.8 — portrait max (Instagram)
const RATIO_MAX = 1.91 // landscape max (Instagram)
const RATIO_DEFAULT = 4 / 3 // fallback for posts without dimensions
const GRID_GAP = "2px"
const GRID_RATIO = "16 / 9"

// ============================================================================
// Helpers
// ============================================================================

/** Clamp image aspect ratio between portrait (4:5) and landscape (1.91:1) */
function getClampedAspectRatio(media: PostMediaType): number {
  if (media.width && media.height && media.width > 0 && media.height > 0) {
    const natural = media.width / media.height
    return Math.min(Math.max(natural, RATIO_MIN), RATIO_MAX)
  }
  return RATIO_DEFAULT
}

// ============================================================================
// GridCell
// ============================================================================

interface GridCellProps {
  media: PostMediaType
  index: number
  onOpen: (index: number) => void
  style?: React.CSSProperties
  overlay?: string
}

function GridCell({ media, index, onOpen, style, overlay }: GridCellProps) {
  return (
    <button
      type="button"
      className="group relative cursor-pointer overflow-hidden focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        onOpen(index)
      }}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Voir le média"
    >
      <Image
        src={media.url}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, 300px"
        className="object-cover select-none"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 z-10 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
      {/* "+N" overlay for excess images */}
      {overlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
          <span className="text-2xl font-bold text-white">{overlay}</span>
        </div>
      )}
    </button>
  )
}

// ============================================================================
// ImageGrid
// ============================================================================

function ImageGrid({
  images,
  onOpen,
}: {
  images: PostMediaType[]
  onOpen: (index: number) => void
}) {
  const count = images.length

  // Single image — clamped aspect ratio
  if (count === 1) {
    return (
      <button
        type="button"
        className="group relative w-full cursor-pointer overflow-hidden rounded-xl focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        style={{ aspectRatio: getClampedAspectRatio(images[0]) }}
        onClick={(e) => {
          e.stopPropagation()
          onOpen(0)
        }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Voir le média"
      >
        <Image
          src={images[0].url}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
          className="cursor-pointer object-cover select-none"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
        <div className="absolute inset-0 z-10 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
      </button>
    )
  }

  // Two images — side-by-side
  if (count === 2) {
    return (
      <div
        className="grid overflow-hidden rounded-xl"
        style={{
          aspectRatio: GRID_RATIO,
          gap: GRID_GAP,
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {images.map((media, i) => (
          <GridCell key={media.mediaId} media={media} index={i} onOpen={onOpen} />
        ))}
      </div>
    )
  }

  // Three images — 1 large left + 2 stacked right
  if (count === 3) {
    return (
      <div
        className="grid overflow-hidden rounded-xl"
        style={{
          aspectRatio: GRID_RATIO,
          gap: GRID_GAP,
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
        }}
      >
        <GridCell
          media={images[0]}
          index={0}
          onOpen={onOpen}
          style={{ gridRow: "1 / 3" }}
        />
        <GridCell media={images[1]} index={1} onOpen={onOpen} />
        <GridCell media={images[2]} index={2} onOpen={onOpen} />
      </div>
    )
  }

  // Four+ images (old posts) — 2x2 grid with "+N" overlay on 4th cell
  return (
    <div
      className="grid overflow-hidden rounded-xl"
      style={{
        aspectRatio: GRID_RATIO,
        gap: GRID_GAP,
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
      }}
    >
      {images.slice(0, 4).map((media, i) => (
        <GridCell
          key={media.mediaId}
          media={media}
          index={i}
          onOpen={onOpen}
          overlay={
            i === 3 && count > 4 ? `+${count - 3}` : undefined
          }
        />
      ))}
    </div>
  )
}

// ============================================================================
// PostMedia (main export)
// ============================================================================

interface PostMediaProps {
  medias: PostMediaType[]
  isMediaLocked?: boolean
  mediaCount?: number
  authorUsername?: string
  onRequireSubscribe: () => void
}

export const PostMedia: React.FC<PostMediaProps> = ({
  medias,
  isMediaLocked = false,
  mediaCount = 0,
  authorUsername,
  onRequireSubscribe,
}) => {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const videoMedias = medias.filter((m) => m.type === "video")
  const imageMedias = medias.filter((m) => m.type === "image")
  const imageSlides = imageMedias.map((m) => ({
    src: m.url,
    width: m.width,
    height: m.height,
  }))

  // Video metadata hook — only when content is not locked and has videos
  const { metadata: videoMetadata } = useVideoMetadata({
    mediaUrls: videoMedias.map((m) => m.url),
    enabled: !isMediaLocked && videoMedias.length > 0,
  })

  // Locked content overlay
  if (isMediaLocked) {
    return (
      <LockedContentOverlay
        mediaCount={mediaCount}
        authorUsername={authorUsername}
        onRequireSubscribe={onRequireSubscribe}
      />
    )
  }

  if (!medias || medias.length === 0) return null

  const openLightbox = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  // Compute video aspect ratio from metadata
  const getVideoRatio = (media: PostMediaType): string => {
    if (media.mediaId && videoMetadata[media.mediaId]) {
      const videoData = videoMetadata[media.mediaId]
      const videoInfo = getVideoDisplayInfo(videoData)
      return getOptimalDisplayRatio(videoInfo)
    }
    return "16 / 9"
  }

  return (
    <>
      {/* Videos first (legacy mixed posts, or single video posts) */}
      {videoMedias.map((media) => (
        <div key={media.url} onClick={(e) => e.stopPropagation()}>
          <BunnyVideoPlayer
            src={media.url}
            aspectRatio={getVideoRatio(media)}
            className="rounded-xl"
          />
        </div>
      ))}

      {/* Image grid */}
      {imageMedias.length > 0 && (
        <div className={cn(videoMedias.length > 0 && "mt-0.5")}>
          <ImageGrid images={imageMedias} onOpen={openLightbox} />
        </div>
      )}

      {/* Lightbox for images */}
      <MediaLightbox
        slides={imageSlides}
        index={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />
    </>
  )
}
