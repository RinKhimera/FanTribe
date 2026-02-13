"use client"

import { POST_CROP_PRESETS } from "@/components/shared/image-crop/aspect-ratio-presets"
import { ImageCropDialog } from "@/components/shared/image-crop/image-crop-dialog"
import { MediaPreviewGrid } from "@/components/new-post/components/media-preview-grid"
import { UploadProgress } from "@/components/new-post/components/upload-progress"
import { usePostComposer } from "./post-composer-context"

export function PostComposerMedia() {
  const { state, actions } = usePostComposer()

  const remainingCount = state.cropQueue.current
    ? state.cropQueue.remaining.length + 1
    : 0

  return (
    <>
      {/* Media Preview Grid */}
      <MediaPreviewGrid
        medias={state.medias}
        onRemove={actions.removeMedia}
        onReorder={actions.reorderMedias}
      />

      {/* Upload Progress */}
      <UploadProgress
        progress={state.upload.progress}
        isUploading={state.upload.isUploading}
      />

      {/* Crop Dialog for images */}
      {state.cropQueue.current && (
        <ImageCropDialog
          imageSrc={state.cropQueue.current.imageSrc}
          open={true}
          onOpenChange={(open) => {
            if (!open) actions.processNextInQueue()
          }}
          onConfirm={actions.handleCropConfirm}
          onCancel={actions.handleCropCancel}
          onSkip={actions.handleCropSkip}
          mode="queue"
          cropShape="rect"
          presets={POST_CROP_PRESETS}
          title={
            remainingCount > 1
              ? `Recadrer l'image (${remainingCount} restante${remainingCount > 1 ? "s" : ""})`
              : "Recadrer l'image"
          }
        />
      )}
    </>
  )
}
