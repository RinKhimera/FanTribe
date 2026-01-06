import { z } from "zod"

export const socialPlatformSchema = z.enum([
  "twitter",
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "snapchat",
  "facebook",
  "website",
  "other",
])

export type SocialPlatform = z.infer<typeof socialPlatformSchema>

export const socialLinkSchema = z.object({
  url: z.string(),
  platform: socialPlatformSchema.optional(),
  username: z.string().optional(),
})

export type SocialLinkFormData = z.infer<typeof socialLinkSchema>

export const profileFormSchema = z.object({
  displayName: z
    .string({ required_error: "Cette entrée est requise." })
    .trim()
    .min(3, {
      message: "Le nom d'affichage doit comporter au moins 3 caractères.",
    })
    .max(30, {
      message: "Le nom d'affichage ne doit pas dépasser 30 caractères.",
    }),
  username: z
    .string({ required_error: "Cette entrée est requise." })
    .trim()
    .min(6, {
      message: "L'identifiant doit comporter au moins 6 caractères.",
    })
    .max(24, {
      message: "L'identifiant ne doit pas dépasser 24 caractères.",
    })
    .refine((value) => value === value.toLowerCase(), {
      message:
        "Le nom d'affichage ne doit contenir que des caractères minuscules.",
    })
    .refine((value) => /^[a-z0-9_]+$/.test(value), {
      message:
        "L'identifiant ne doit pas contenir des caractères non-alphanumériques.",
    })
    .refine((value) => (value.match(/_/g) || []).length <= 1, {
      message: "L'identifiant ne doit pas contenir plus d'un underscore.",
    }),
  bio: z
    .string({ required_error: "Cette entrée est requise." })
    .trim()
    .min(4, {
      message: "La description doit comporter au moins 4 caractères.",
    })
    .max(150, {
      message: "La description ne doit pas dépasser 150 caractères.",
    }),
  location: z
    .string({ required_error: "Cette entrée est requise." })
    .trim()
    .min(2, {
      message: "La location doit comporter au moins 2 caractères.",
    })
    .max(40, {
      message: "La location ne doit pas dépasser 40 caractères.",
    }),
  socialLinks: z
    .array(socialLinkSchema)
    .max(5, { message: "Vous ne pouvez pas ajouter plus de 5 liens." })
    .optional()
    .refine(
      (links) => {
        if (!links) return true
        const urls = links.map((l) => l.url).filter((url) => url.trim() !== "")
        return new Set(urls).size === urls.length
      },
      { message: "Les URLs doivent être uniques." },
    ),
})
