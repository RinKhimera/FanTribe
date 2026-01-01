"use client"

import { useMutation } from "convex/react"
import {
  CheckCircle,
  Clock,
  Crown,
  HeadphonesIcon,
  RotateCcw,
  Shield,
  XCircle,
} from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { stepContentVariants, stepItemVariants } from "@/lib/animations"

interface ApplicationStatusProps {
  application: Doc<"creatorApplications">
  userId: Id<"users">
  onReapplySuccess?: () => void // Simplifié - plus de données à passer
}

// Helper pour formater le temps restant
const formatTimeRemaining = (timestamp: number): string => {
  const now = Date.now()
  const diff = timestamp - now
  if (diff <= 0) return "maintenant"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`
  }
  return `${minutes} minutes`
}

export const ApplicationStatus = ({
  application,
  userId,
  onReapplySuccess,
}: ApplicationStatusProps) => {
  const router = useRouter()
  const [isRequesting, setIsRequesting] = useState(false)
  const [lockInfo, setLockInfo] = useState<{
    mustContactSupport?: boolean
    waitUntil?: number | null
  } | null>(null)

  const requestReapplication = useMutation(
    api.creatorApplications.requestReapplication
  )

  if (application.status === "pending") {
    return (
      <motion.div
        variants={stepContentVariants}
        initial="initial"
        animate="animate"
        className="flex flex-1 items-center justify-center p-6"
      >
        <motion.div variants={stepItemVariants}>
          <Card className="glass-premium mx-auto max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-yellow-500/10">
                <Shield className="size-8 text-yellow-500" />
              </div>
              <CardTitle>Candidature en cours d&apos;examen</CardTitle>
              <CardDescription className="text-base">
                Nous examinons votre demande avec attention. Vous recevrez une
                réponse sous 24-48h.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button disabled className="w-full" size="lg">
                Candidature soumise
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  if (application.status === "approved") {
    return (
      <motion.div
        variants={stepContentVariants}
        initial="initial"
        animate="animate"
        className="flex flex-1 items-center justify-center p-6"
      >
        <motion.div variants={stepItemVariants}>
          <Card className="glass-premium mx-auto max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="size-8 text-green-500" />
              </div>
              <CardTitle className="text-gold-gradient">
                Candidature approuvée !
              </CardTitle>
              <CardDescription className="text-base">
                Félicitations ! Votre compte créateur est maintenant actif. Vous
                pouvez commencer à publier du contenu.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="btn-premium w-full"
                size="lg"
                onClick={() => router.push("/new-post")}
              >
                <Crown className="mr-2 size-4" />
                Commencer à créer
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  if (application.status === "rejected") {
    const handleReapply = async () => {
      setIsRequesting(true)
      setLockInfo(null)

      try {
        const result = await requestReapplication({ userId })

        if (result.canReapply) {
          toast.success("Vous pouvez maintenant soumettre une nouvelle candidature")
          onReapplySuccess?.() // Simplifié - plus de données
        } else if (result.mustContactSupport) {
          setLockInfo({ mustContactSupport: true })
        } else if (result.waitUntil) {
          setLockInfo({ waitUntil: result.waitUntil })
        }
      } catch (error) {
        console.error("Erreur lors de la demande de repostulation:", error)
        toast.error("Une erreur est survenue")
      } finally {
        setIsRequesting(false)
      }
    }

    const rejectionCount = application.rejectionCount ?? 1

    return (
      <motion.div
        variants={stepContentVariants}
        initial="initial"
        animate="animate"
        className="flex flex-1 items-center justify-center p-6"
      >
        <motion.div variants={stepItemVariants}>
          <Card className="glass-premium mx-auto max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="size-8 text-red-500" />
              </div>
              <CardTitle>Candidature refusée</CardTitle>
              <CardDescription className="text-base">
                Malheureusement, votre candidature n&apos;a pas été retenue.
                {application.adminNotes && (
                  <span className="mt-2 block text-sm">
                    Raison : {application.adminNotes}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3">
              {/* Message de soft lock */}
              {lockInfo?.mustContactSupport && (
                <div className="flex w-full items-center gap-2 rounded-lg bg-orange-500/10 p-3 text-sm text-orange-600 dark:text-orange-400">
                  <HeadphonesIcon className="size-4 shrink-0" />
                  <span>
                    Vous avez atteint le nombre maximum de tentatives. Veuillez
                    contacter le support pour continuer.
                  </span>
                </div>
              )}

              {lockInfo?.waitUntil && (
                <div className="flex w-full items-center gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                  <Clock className="size-4 shrink-0" />
                  <span>
                    Vous pourrez repostuler dans{" "}
                    {formatTimeRemaining(lockInfo.waitUntil)}
                  </span>
                </div>
              )}

              {/* Bouton repostuler */}
              {lockInfo?.mustContactSupport ? (
                <Button
                  asChild
                  variant="outline"
                  className="btn-premium-outline w-full"
                  size="lg"
                >
                  <Link href="/support">
                    <HeadphonesIcon className="mr-2 size-4" />
                    Contacter le support
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="btn-premium-outline w-full"
                  size="lg"
                  onClick={handleReapply}
                  disabled={isRequesting || !!lockInfo?.waitUntil}
                >
                  {isRequesting ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 size-4" />
                      Postuler à nouveau
                      {rejectionCount > 1 && (
                        <span className="ml-1 text-xs opacity-70">
                          (tentative {rejectionCount + 1})
                        </span>
                      )}
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  return null
}

export const AlreadyCreator = () => {
  return (
    <motion.div
      variants={stepContentVariants}
      initial="initial"
      animate="animate"
      className="flex flex-1 items-center justify-center p-6"
    >
      <motion.div variants={stepItemVariants}>
        <Card className="glass-premium mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Crown className="text-primary size-8" />
            </div>
            <CardTitle className="text-gold-gradient">
              Vous êtes déjà créateur !
            </CardTitle>
            <CardDescription className="text-base">
              Votre compte créateur est actif. Vous pouvez publier du contenu et
              gérer votre audience.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="btn-premium w-full" size="lg">
              <Link href="/new-post">
                <Crown className="mr-2 size-4" />
                Créer un post
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  )
}
