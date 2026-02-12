export type AspectRatioPreset = {
  label: string
  value: number
}

/** Presets for post and message image cropping */
export const POST_CROP_PRESETS: AspectRatioPreset[] = [
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
]

export const AVATAR_ASPECT = 1
export const BANNER_ASPECT = 3 / 1
