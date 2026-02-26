"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "convex/react"
import {
  AlertCircle,
  AtSign,
  Camera,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
} from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { UsernameSuggestions } from "@/components/onboarding/username-suggestions"
import {
  AVATAR_ASPECT,
} from "@/components/shared/image-crop/aspect-ratio-presets"
import { ImageCropDialog } from "@/components/shared/image-crop/image-crop-dialog"
import { FormSection } from "@/components/shared/profile-form/form-section"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { useDebounce, useBunnyUpload } from "@/hooks"
import { logger } from "@/lib/config/logger"
import { onboardingStep1Schema, OnboardingStep1Data } from "@/schemas/profile"
import { cn } from "@/lib/utils"

export type Step1Payload = OnboardingStep1Data & { _avatarUrl?: string | null }

interface StepIdentityProps {
  currentUser: Doc<"users">
  onNext: (data: Step1Payload) => Promise<void>
  isSubmitting: boolean
}

type CropDialogState = {
  imageSrc: string
  file: File
} | null

export const StepIdentity = ({
  currentUser,
  onNext,
  isSubmitting,
}: StepIdentityProps) => {
  const [isPendingUpload, startUploadTransition] = useTransition()
  const { uploadMedia } = useBunnyUpload()

  const [cropDialogState, setCropDialogState] = useState<CropDialogState>(null)
  const [optimisticAvatar, setOptimisticAvatar] = useState<string | null>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<OnboardingStep1Data>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: {
      displayName: currentUser.name || "",
      username: "",
    },
    mode: "onChange",
  })

  const watchUsername = form.watch("username")
  const debouncedUsername = useDebounce(watchUsername, 300)

  const isUsernameAvailable = useQuery(
    api.users.getAvailableUsername,
    debouncedUsername && debouncedUsername.length >= 6
      ? {
          username: debouncedUsername,
          tokenIdentifier: currentUser.tokenIdentifier,
        }
      : "skip",
  )

  const suggestions = useQuery(
    api.users.suggestUsernames,
    isUsernameAvailable === false ? { baseName: currentUser.name || "" } : "skip",
  )

  // Keep optimistic preview in sync
  const prevImageRef = useRef(currentUser.image)
  useEffect(() => {
    if (optimisticAvatar && currentUser.image !== prevImageRef.current) {
      URL.revokeObjectURL(optimisticAvatar)
      setOptimisticAvatar(null)
    }
    prevImageRef.current = currentUser.image
  }, [currentUser.image, optimisticAvatar])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux. Taille maximale : 10 Mo")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCropDialogState({ imageSrc: objectUrl, file })
  }

  const handleCropConfirm = async (croppedBlob: Blob) => {
    if (!cropDialogState) return
    const { file } = cropDialogState

    const previewUrl = URL.createObjectURL(croppedBlob)
    setOptimisticAvatar(previewUrl)

    URL.revokeObjectURL(cropDialogState.imageSrc)
    setCropDialogState(null)

    const croppedFile = new File([croppedBlob], file.name, {
      type: croppedBlob.type,
    })

    startUploadTransition(async () => {
      try {
        const fileExtension = file.name.split(".").pop() || "jpg"
        const randomSuffix = crypto.randomUUID().replace(/-/g, "").substring(0, 13)
        const fileName = `${currentUser._id}/avatar_${randomSuffix}.${fileExtension}`

        const result = await uploadMedia({
          file: croppedFile,
          fileName,
          userId: currentUser._id as string,
        })

        if (!result.success) throw new Error(result.error || "Upload échoué")

        setUploadedAvatarUrl(result.url)
        toast.success("Photo de profil mise à jour")
      } catch (error) {
        URL.revokeObjectURL(previewUrl)
        setOptimisticAvatar(null)
        logger.error("Failed to upload avatar during onboarding", error)
        toast.error("Erreur lors de l'upload de la photo")
      }
    })
  }

  const handleCropCancel = () => {
    if (cropDialogState) {
      URL.revokeObjectURL(cropDialogState.imageSrc)
    }
    setCropDialogState(null)
  }

  const displayedAvatar = optimisticAvatar || uploadedAvatarUrl || currentUser.image

  const onSubmit = async (data: OnboardingStep1Data) => {
    if (isUsernameAvailable === false) {
      toast.error("Cet identifiant est déjà pris !")
      return
    }
    await onNext({ ...data, _avatarUrl: uploadedAvatarUrl })
  }

  const isCheckingUsername =
    debouncedUsername && debouncedUsername.length >= 6 && isUsernameAvailable === undefined

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Avatar Upload */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Choisir une photo de profil"
          onChange={handleFileSelect}
        />

        <FormSection icon={<User className="size-4" />} title="Photo de profil" delay={0}>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <Avatar
                className={cn(
                  "ring-background size-24 cursor-pointer ring-4 transition-shadow hover:shadow-xl",
                  { "pointer-events-none opacity-50": isPendingUpload },
                )}
                onClick={() => !isPendingUpload && avatarInputRef.current?.click()}
              >
                {displayedAvatar ? (
                  <AvatarImage
                    src={displayedAvatar}
                    className="object-cover"
                    alt={currentUser.name || "Photo de profil"}
                  />
                ) : (
                  <AvatarFallback className="bg-muted text-2xl">
                    {currentUser.name?.charAt(0) || "?"}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Camera badge */}
              <button
                type="button"
                onClick={() => !isPendingUpload && avatarInputRef.current?.click()}
                className={cn(
                  "absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center",
                  "bg-primary rounded-full shadow-md transition-transform hover:scale-110",
                  { "opacity-50 pointer-events-none": isPendingUpload },
                )}
                aria-label="Changer la photo de profil"
              >
                {isPendingUpload ? (
                  <Loader2 className="size-4 animate-spin text-white" />
                ) : (
                  <Camera className="size-4 text-white" />
                )}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-muted-foreground text-sm">
                Cliquez sur la photo pour la modifier
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                JPG, PNG — max 10 Mo
              </p>
            </div>
          </div>
        </FormSection>

        {/* Identity fields */}
        <FormSection icon={<AtSign className="size-4" />} title="Identité" delay={0.05}>
          {/* Display name */}
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
                  Nom d&apos;affichage
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Votre nom public"
                      className="glass-input rounded-xl border-0 pl-10"
                      autoComplete="name"
                      {...field}
                    />
                    <Sparkles className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Ce nom sera visible publiquement sur votre profil
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
                  Identifiant
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="votre_identifiant"
                      className={cn(
                        "glass-input rounded-xl border-0 pl-10 pr-10",
                        isUsernameAvailable === false && "ring-destructive ring-2",
                        isUsernameAvailable === true && "ring-2 ring-emerald-500",
                      )}
                      autoComplete="username"
                      spellCheck={false}
                      {...field}
                    />
                    <AtSign className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                    {/* Availability indicator */}
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                      {isCheckingUsername && (
                        <Loader2 className="text-muted-foreground size-4 animate-spin" />
                      )}
                      {isUsernameAvailable === true && !isCheckingUsername && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                      {isUsernameAvailable === false && !isCheckingUsername && (
                        <AlertCircle className="text-destructive size-4" />
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Votre identifiant unique — lettres minuscules, chiffres, _
                </FormDescription>
                {isUsernameAvailable === false && (
                  <p className="text-destructive text-xs">
                    Cet identifiant est déjà pris
                  </p>
                )}
                <FormMessage />

                {/* Username suggestions */}
                <UsernameSuggestions
                  suggestions={suggestions ?? []}
                  onSelect={(s) => form.setValue("username", s, { shouldValidate: true })}
                />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              isPendingUpload ||
              isUsernameAvailable === false ||
              !form.formState.isValid
            }
            className="btn-premium flex cursor-pointer items-center gap-2 rounded-xl px-8 py-2.5 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Enregistrement…</span>
              </>
            ) : (
              <>
                <span>Continuer</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Crop dialog */}
      {cropDialogState && (
        <ImageCropDialog
          imageSrc={cropDialogState.imageSrc}
          open={true}
          onOpenChange={(open) => { if (!open) handleCropCancel() }}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          cropShape="round"
          aspectRatio={AVATAR_ASPECT}
          title="Recadrer la photo de profil"
        />
      )}
    </Form>
  )
}
