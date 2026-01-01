"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { motion } from "motion/react"
import { CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { AboutSection, IdentitySection, LinksSection } from "./profile-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"
import { profileFormSchema } from "@/schemas/profile"

export const EditProfileForm = ({
  currentUser,
}: {
  currentUser: Doc<"users"> | undefined
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const updateProfile = useMutation(api.users.updateUserProfile)

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: currentUser?.username,
      displayName: currentUser?.name,
      bio: currentUser?.bio,
      location: currentUser?.location,
      urls: (currentUser?.socials || []).map((url) => ({ value: url })),
    },
  })

  const fieldArray = useFieldArray({
    name: "urls",
    control: form.control,
  })

  const { watch } = form
  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form's watch is intentionally used here
  const watchUsername = watch("username")

  const checkUsername = useQuery(api.users.getAvailableUsername, {
    username: watchUsername || "",
    tokenIdentifier: currentUser?.tokenIdentifier || "",
  })

  const onSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    startTransition(async () => {
      try {
        if (checkUsername === true) {
          await updateProfile({
            name: data.displayName,
            username: data.username,
            bio: data.bio,
            location: data.location,
            socials: (data.urls || []).map((url) => url.value),
            tokenIdentifier: currentUser?.tokenIdentifier || "",
          })

          toast.success("Profil mis à jour avec succès")

          if (pathname === "/onboarding") {
            router.push("/")
          } else {
            router.push(`/${data.username}`)
          }
        } else if (checkUsername === false) {
          toast.error("Cet identifiant est déjà pris !", {
            description: "Veuillez en choisir un autre",
          })
        }
      } catch (error) {
        logger.error("Failed to update profile", error, {
          username: data.username,
        })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const isOnboarding = pathname === "/onboarding"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <IdentitySection
          form={form}
          watchUsername={watchUsername}
          checkUsername={checkUsername}
        />

        <AboutSection form={form} />

        <LinksSection form={form} fieldArray={fieldArray} />

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end pt-2"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={isPending || checkUsername === false}
              className="gap-2 rounded-xl px-8"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : isOnboarding ? (
                <>
                  <Sparkles className="size-4" />
                  <span>Compléter l&apos;inscription</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </form>
    </Form>
  )
}
