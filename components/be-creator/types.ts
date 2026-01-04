import { z } from "zod"

export const applicationSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  dateOfBirth: z.string().min(1, "La date de naissance est requise"),
  address: z.string().min(10, "L'adresse complète est requise"),
  whatsappNumber: z
    .string()
    .regex(/^\d{9}$/, "Le numéro doit contenir exactement 9 chiffres"),
  mobileMoneyNumber: z
    .string()
    .regex(/^\d{9}$/, "Le numéro doit contenir exactement 9 chiffres"),
  mobileMoneyNumber2: z
    .string()
    .regex(/^\d{9}$/, "Le numéro doit contenir exactement 9 chiffres")
    .optional()
    .or(z.literal("")),
  applicationReason: z.enum(
    [
      "passion_partage",
      "expertise_professionnelle",
      "influence_communaute",
      "creativite_artistique",
      "business_entrepreneur",
      "education_formation",
      "lifestyle_personnel",
      "autre",
    ],
    {
      required_error: "Veuillez sélectionner une motivation",
    }
  ),
  customReason: z.string().optional(),
})

export type ApplicationFormData = z.infer<typeof applicationSchema>

export interface UploadedDocument {
  url: string
  mediaId: string
  uploadedAt: number
}

export interface UploadedDocuments {
  identityCard?: UploadedDocument
  selfie?: UploadedDocument
}

export const motivationOptions = [
  {
    value: "passion_partage" as const,
    label: "Partager ma passion",
    description:
      "Faire découvrir mes centres d'intérêts et hobbies à une communauté",
  },
  {
    value: "expertise_professionnelle" as const,
    label: "Partager mon expertise professionnelle",
    description: "Transmettre mes connaissances métier et expériences",
  },
  {
    value: "influence_communaute" as const,
    label: "Développer mon influence",
    description: "Construire une communauté engagée autour de mes idées",
  },
  {
    value: "creativite_artistique" as const,
    label: "Exprimer ma créativité artistique",
    description:
      "Montrer mes créations artistiques, photos, vidéos, musique...",
  },
  {
    value: "business_entrepreneur" as const,
    label: "Développer mon business",
    description:
      "Promouvoir mes produits/services et développer mon entreprise",
  },
  {
    value: "education_formation" as const,
    label: "Éduquer et former",
    description: "Créer du contenu éducatif, tutoriels, formations",
  },
  {
    value: "lifestyle_personnel" as const,
    label: "Partager mon style de vie",
    description: "Documenter et partager mon quotidien, mes voyages, ma vie",
  },
  {
    value: "autre" as const,
    label: "Autre raison",
    description: "Une motivation spécifique non listée ci-dessus",
  },
]
