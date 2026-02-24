"use client"

import { useRef } from "react"
import { MediaUploadButton } from "@/components/new-post/components/media-upload-button"
import { VisibilitySelector } from "@/components/new-post/components/visibility-selector"
import { AdultContentToggle } from "@/components/new-post/components/adult-content-toggle"
import { usePostComposer } from "./post-composer-context"

export function PostComposerActions() {
  const { state, actions, config } = usePostComposer()
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-1">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={state.mediaMode !== "video"}
        accept={state.fileAccept}
        onChange={actions.handleFileSelect}
        className="hidden"
      />

      {/* Media Upload Button */}
      <MediaUploadButton
        mediaCount={state.medias.length}
        maxMedia={config.maxMedia}
        mediaMode={state.mediaMode}
        isPending={state.isPending}
        isUploading={state.upload.isUploading}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      {/* Visibility Selector */}
      <VisibilitySelector
        value={state.visibility}
        onChange={actions.setVisibility}
      />

      {/* Adult Content Toggle */}
      <AdultContentToggle
        value={state.isAdult}
        onChange={actions.setIsAdult}
        disabled={state.isPending || state.upload.isUploading}
      />
    </div>
  )
}
