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
import { CircleX, GripVertical, X, ZoomIn } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
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
}

interface MediaPreviewGridProps {
  medias: MediaItem[]
  onRemove: (index: number) => void
  onReorder: (medias: MediaItem[]) => void
}

// Sortable wrapper for each media item
function SortableMediaItem({
  media,
  index,
  onRemove,
  onPreview,
  isDragDisabled,
}: {
  media: MediaItem
  index: number
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "group relative overflow-hidden rounded-xl",
        isDragging && "z-10 opacity-80 shadow-xl",
      )}
    >
      {/* Drag handle — top left, images only */}
      {!isDragDisabled && (
        <button
          type="button"
          className={cn(
            "absolute top-2 left-2 z-10 flex size-8 items-center justify-center rounded-full",
            "bg-black/60 hover:bg-black/80",
            "opacity-0 group-hover:opacity-100",
            "cursor-grab active:cursor-grabbing",
            "transition-opacity duration-200",
          )}
          aria-label="Réorganiser"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 text-white" />
        </button>
      )}

      {/* Remove button — top right */}
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={cn(
          "absolute top-2 right-2 z-10 size-8",
          "bg-black/60 hover:bg-black/80",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200",
        )}
        onClick={() => onRemove(index)}
      >
        <CircleX className="size-5 text-white" />
      </Button>

      {media.type === "video" ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
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
          className="relative cursor-pointer"
          onClick={() => onPreview(media.url)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPreview(media.url)
          }}
        >
          <Image
            src={media.url}
            alt=""
            width={500}
            height={300}
            className="aspect-video w-full rounded-xl object-cover"
          />
          {/* Zoom hint */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-black/0 group-hover:bg-black/20",
              "transition-colors duration-200",
            )}
          >
            <ZoomIn
              className={cn(
                "size-6 text-white opacity-0 group-hover:opacity-80",
                "transition-opacity duration-200",
              )}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

export const MediaPreviewGrid = ({
  medias,
  onRemove,
  onReorder,
}: MediaPreviewGridProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const isDragDisabled = medias.length <= 1 || medias[0]?.type === "video"

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 grid grid-cols-2 gap-3"
          >
            <AnimatePresence>
              {medias.map((media, index) => (
                <SortableMediaItem
                  key={media.publicId}
                  media={media}
                  index={index}
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
