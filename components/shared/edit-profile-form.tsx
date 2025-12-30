"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Globe,
  Link2,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  User,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { itemVariants } from "@/lib/animations"
import { logger } from "@/lib/config/logger"
import { cn } from "@/lib/utils"
import { profileFormSchema } from "@/schemas/profile"

interface FormSectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  delay?: number
}

const FormSection = ({ icon, title, children, delay = 0 }: FormSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card space-y-4 rounded-2xl p-5"
  >
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className="text-primary">{icon}</span>
      <span>{title}</span>
    </div>
    {children}
  </motion.div>
)

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

  const { fields, append, remove } = useFieldArray({
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
        {/* Identity Section */}
        <FormSection
          icon={<User className="size-4" />}
          title="Identité"
          delay={0}
        >
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
                        checkUsername === false && "ring-destructive ring-2",
                        checkUsername === true && "ring-2 ring-emerald-500"
                      )}
                      {...field}
                    />
                    <AtSign className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                      {watchUsername && watchUsername.length >= 6 && (
                        <AnimatePresence mode="wait">
                          {checkUsername === undefined ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Loader2 className="text-muted-foreground size-4 animate-spin" />
                            </motion.div>
                          ) : checkUsername === true ? (
                            <motion.div
                              key="available"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="taken"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <AlertCircle className="text-destructive size-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Votre identifiant unique (lettres minuscules, chiffres, _)
                </FormDescription>
                <FormMessage>
                  {checkUsername === false && (
                    <span className="text-destructive text-xs">
                      Cet identifiant est déjà pris
                    </span>
                  )}
                </FormMessage>
              </FormItem>
            )}
          />
        </FormSection>

        {/* About Section */}
        <FormSection
          icon={<Globe className="size-4" />}
          title="À propos"
          delay={0.1}
        >
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
                  Bio
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Parlez de vous en quelques mots..."
                    className="glass-input min-h-24 resize-none rounded-xl border-0"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {field.value?.length || 0}/150 caractères
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
                  Localisation
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Paris, France"
                      className="glass-input rounded-xl border-0 pl-10"
                      {...field}
                    />
                    <MapPin className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Links Section */}
        <FormSection
          icon={<Link2 className="size-4" />}
          title="Liens"
          delay={0.2}
        >
          <FormDescription className="text-xs">
            Ajoutez des liens vers vos réseaux sociaux ou votre site web
          </FormDescription>

          <AnimatePresence mode="popLayout">
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
              >
                <FormField
                  control={form.control}
                  name={`urls.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                          <div className="relative flex-1">
                            <Input
                              {...inputField}
                              placeholder="https://..."
                              className="glass-input rounded-xl border-0 pl-10"
                            />
                            <Globe className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          </div>
                        </FormControl>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="hover:bg-destructive/10 hover:text-destructive size-10 rounded-xl"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </motion.div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: "" })}
              className="glass-button w-full gap-2 rounded-xl"
            >
              <Plus className="size-4" />
              Ajouter un lien
            </Button>
          </motion.div>
        </FormSection>

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
