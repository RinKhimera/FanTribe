"use client"

import { motion } from "motion/react"
import {
  CheckCircle,
  Crown,
  RotateCcw,
  Shield,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { stepContentVariants, stepItemVariants } from "@/lib/animations"
import { Doc } from "@/convex/_generated/dataModel"

interface ApplicationStatusProps {
  application: Doc<"creatorApplications">
  onReapply?: () => void
}

export const ApplicationStatus = ({
  application,
  onReapply,
}: ApplicationStatusProps) => {
  const router = useRouter()

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
            <CardFooter>
              <Button
                variant="outline"
                className="btn-premium-outline w-full"
                size="lg"
                onClick={onReapply}
              >
                <RotateCcw className="mr-2 size-4" />
                Postuler à nouveau
              </Button>
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
