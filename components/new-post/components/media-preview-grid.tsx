"use client"

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, X, ZoomIn } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface MediaItem {
  url: string
  publicId: string
  type: "image" | "video"
  mimeType: string
  fileName: string
  fileSize: number
  width?: number
  height?: number
  thumbnailUrl?: string
}

interface MediaPreviewGridProps {
  medias: MediaItem[]
  onRemove: (index: number) => void
  onReorder: (medias: MediaItem[]) => void
}

// --- Adaptive grid helpers ---

function getGridLayout(count: number, isVideo: boolean): string {
  if (isVideo) return "grid-cols-1"
  switch (count) {
    case 1:
      return "grid-cols-1"
    case 2:
      return "grid-cols-2"
    case 3:
      return "grid-cols-2 grid-rows-2"
    default:
      return "grid-cols-2"
  }
}

function getItemClasses(count: number, index: number, isVideo: boolean): string {
  if (isVideo) return ""
  switch (count) {
    case 1:
      return ""
    case 2:
      return "aspect-[4/5]"
    case 3:
      if (index === 0) return "row-span-2"
      return "aspect-square"
    default:
      return "aspect-video"
  }
}

// --- Sortable item ---

function SortableMediaItem({
  media,
  index,
  count,
  isVideo,
  onRemove,
  onPreview,
  isDragDisabled,
}: {
  media: MediaItem
  index: number
  count: number
  isVideo: boolean
  onRemove: (index: number) => void
  onPreview: (url: string) => void
  isDragDisabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.publicId, disabled: isDragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isSingleImage = count === 1 && !isVideo
  const isLeftColumn3 = count === 3 && index === 0

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden",
        getItemClasses(count, index, isVideo),
        isDragging && "z-10 ring-2 ring-primary/50 shadow-2xl scale-[1.02]",
      )}
    >
      {/* Drag handle — bottom left, images only, 2+ items */}
      {!isDragDisabled && (
        <button
          type="button"
          className={cn(
            "absolute bottom-1.5 left-1.5 z-10",
            "flex size-7 items-center justify-center gap-0.5 rounded-lg",
            "bg-black/60 hover:bg-black/80",
            "opacity-0 group-hover:opacity-100",
            "cursor-grab active:cursor-grabbing",
            "transition-opacity duration-200",
          )}
          aria-label={`Réorganiser position ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5 text-white" />
          <span className="text-[10px] font-bold text-white/80">
            {index + 1}
          </span>
        </button>
      )}

      {/* Remove button — top right */}
      <button
        type="button"
        aria-label="Supprimer le média"
        className={cn(
          "absolute top-1.5 right-1.5 z-10",
          "flex size-7 items-center justify-center rounded-full",
          "bg-black/60 text-white",
          "opacity-0 transition-all duration-200",
          "hover:bg-red-500 group-hover:opacity-100",
          "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/50",
        )}
        onClick={() => onRemove(index)}
      >
        <X className="size-4" />
      </button>

      {media.type === "video" ? (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <iframe
            src={media.url}
            loading="lazy"
            className="h-full w-full"
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          className={cn(
            "relative cursor-pointer",
            !isSingleImage && "h-full",
          )}
          onClick={() => onPreview(media.url)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPreview(media.url)
          }}
        >
          {isSingleImage ? (
            <Image
              src={media.url}
              alt=""
              width={600}
              height={400}
              className="h-auto max-h-96 w-full object-cover"
            />
          ) : isLeftColumn3 ? (
            <Image
              src={media.url}
              alt=""
              fill
              sizes="50vw"
              className="object-cover"
            />
          ) : (
            <Image
              src={media.url}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="object-cover"
            />
          )}

          {/* Zoom hint — bottom right badge */}
          <div
            className={cn(
              "absolute bottom-1.5 right-1.5 z-10",
              "flex size-7 items-center justify-center rounded-full",
              "bg-black/40 opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200",
            )}
          >
            <ZoomIn className="size-3.5 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  )
}

// --- Main grid component ---

export const MediaPreviewGrid = ({
  medias,
  onRemove,
  onReorder,
}: MediaPreviewGridProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const isVideo = medias.length > 0 && medias[0].type === "video"
  const isDragDisabled = medias.length <= 1 || isVideo

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = medias.findIndex((m) => m.publicId === active.id)
    const newIndex = medias.findIndex((m) => m.publicId === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(arrayMove(medias, oldIndex, newIndex))
  }

  if (medias.length === 0) return null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={medias.map((m) => m.publicId)}
          strategy={rectSortingStrategy}
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "mt-4 grid overflow-hidden rounded-xl",
              getGridLayout(medias.length, isVideo),
              medias.length === 1 ? "gap-0" : "gap-1.5",
            )}
          >
            <AnimatePresence mode="popLayout">
              {medias.map((media, index) => (
                <SortableMediaItem
                  key={media.publicId}
                  media={media}
                  index={index}
                  count={medias.length}
                  isVideo={isVideo}
                  onRemove={onRemove}
                  onPreview={setPreviewUrl}
                  isDragDisabled={isDragDisabled}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </SortableContext>
      </DndContext>

      {/* Fullscreen image preview */}
      <Dialog
        open={previewUrl !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewUrl(null)
        }}
      >
        <DialogContent
          className="flex max-h-[90vh] max-w-[90vw] items-center justify-center border-none bg-black/90 p-0 backdrop-blur-xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Aperçu de l&apos;image</DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10 text-white hover:bg-white/20"
              aria-label="Fermer l'aperçu"
            >
              <X className="size-5" />
            </Button>
          </DialogClose>
          {previewUrl && (
            <Image
              src={previewUrl}
              alt="Aperçu"
              width={1200}
              height={900}
              className="max-h-[85vh] w-auto rounded object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
