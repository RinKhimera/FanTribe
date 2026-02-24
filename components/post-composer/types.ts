import { Id } from "@/convex/_generated/dataModel"
import { MediaItem } from "@/components/new-post/components/media-preview-grid"
import { PostVisibility } from "@/components/new-post/components/visibility-selector"

/**
 * Configuration initiale du PostComposer (props du Provider)
 */
export type PostComposerConfig = {
  userId: Id<"users">
  maxMedia: number
  onSuccess?: (postId: Id<"posts">) => void
}

/**
 * État de l'upload en cours
 */
export type UploadState = {
  isUploading: boolean
  progress: Record<string, number> // fileKey → percent
}

/**
 * Item dans la queue de crop
 */
export type CropQueueItem = {
  file: File
  imageSrc: string // ObjectURL
}

/**
 * État de la queue de crop
 */
export type CropQueueState = {
  current: CropQueueItem | null
  remaining: File[]
}

/**
 * Mode média (dérivé de medias array)
 */
export type MediaMode = "empty" | "images" | "video"

/**
 * État global du composer
 */
export type PostComposerState = {
  // Form data
  content: string
  medias: MediaItem[]
  visibility: PostVisibility
  isAdult: boolean

  // Upload state
  upload: UploadState

  // Crop state
  cropQueue: CropQueueState

  // Submit state
  isPending: boolean

  // Derived state (computed in useMemo)
  mediaMode: MediaMode
  canAddMedia: boolean
  fileAccept: string
}

/**
 * Actions disponibles dans le composer
 */
export type PostComposerActions = {
  // Content
  setContent: (content: string) => void

  // Medias
  addMedia: (media: MediaItem) => void
  removeMedia: (index: number) => Promise<void>
  reorderMedias: (medias: MediaItem[]) => void

  // Visibility & Adult
  setVisibility: (visibility: PostVisibility) => void
  setIsAdult: (isAdult: boolean) => void

  // Upload
  startUpload: (fileKey: string) => void
  updateUploadProgress: (fileKey: string, percent: number) => void
  finishUpload: (fileKey: string) => void

  // Crop queue
  startCropQueue: (files: File[]) => void
  processNextInQueue: () => void
  cancelCropQueue: () => void

  // Crop handlers
  handleCropConfirm: (croppedBlob: Blob) => Promise<void>
  handleCropSkip: () => Promise<void>
  handleCropCancel: () => void

  // File selection
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>

  // Submit
  submit: () => Promise<void>
  reset: () => void
}

/**
 * Context value (state + actions + config)
 */
export type PostComposerContextValue = {
  state: PostComposerState
  actions: PostComposerActions
  config: PostComposerConfig
}

// --- Sub-context types for split providers ---

/**
 * Form-specific context (content, visibility, submission)
 */
export type PostComposerFormContextValue = {
  content: string
  visibility: PostVisibility
  isAdult: boolean
  isPending: boolean
  setContent: (content: string) => void
  setVisibility: (visibility: PostVisibility) => void
  setIsAdult: (isAdult: boolean) => void
  submit: () => Promise<void>
  reset: () => void
}

/**
 * Media-specific context (medias, uploads, crop queue)
 */
export type PostComposerMediaContextValue = {
  medias: MediaItem[]
  mediaMode: MediaMode
  canAddMedia: boolean
  fileAccept: string
  upload: UploadState
  cropQueue: CropQueueState
  addMedia: (media: MediaItem) => void
  removeMedia: (index: number) => Promise<void>
  reorderMedias: (medias: MediaItem[]) => void
  startUpload: (fileKey: string) => void
  updateUploadProgress: (fileKey: string, percent: number) => void
  finishUpload: (fileKey: string) => void
  startCropQueue: (files: File[]) => void
  processNextInQueue: () => void
  cancelCropQueue: () => void
  handleCropConfirm: (croppedBlob: Blob) => Promise<void>
  handleCropSkip: () => Promise<void>
  handleCropCancel: () => void
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}
