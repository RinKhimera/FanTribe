"use client"

import { motion } from "motion/react"
import {
  ArrowRight,
  Camera,
  Crown,
  FileText,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { stepContentVariants, stepItemVariants } from "@/lib/animations"

const features = [
  {
    icon: Zap,
    title: "Publier du contenu",
    description: "Créez et partagez vos posts avec votre audience",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Star,
    title: "Contenu exclusif",
    description: "Proposez du contenu premium à vos abonnés",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Crown,
    title: "Monétisation",
    description: "Gagnez de l'argent grâce à vos abonnés",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
]

const verificationSteps = [
  {
    icon: FileText,
    title: "Remplir le formulaire",
    description: "Informations personnelles et motivations",
  },
  {
    icon: Camera,
    title: "Vérification d'identité",
    description: "Photo de pièce d'identité + selfie",
  },
  {
    icon: Shield,
    title: "Validation",
    description: "Examen par notre équipe (24-48h)",
  },
]

interface StepIntroductionProps {
  onNext: () => void
}

export const StepIntroduction = ({ onNext }: StepIntroductionProps) => {
  return (
    <motion.div
      variants={stepContentVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Hero Section */}
      <motion.div variants={stepItemVariants} className="text-center">
        <div className="relative mx-auto mb-6 inline-flex">
          <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gold-400)] to-[var(--gold-600)]">
            <Crown className="size-10 text-[oklch(0.15_0.02_60)]" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
            className="absolute -right-1 -top-1 flex size-8 items-center justify-center rounded-full bg-primary"
          >
            <Sparkles className="size-4 text-white" />
          </motion.div>
        </div>
        <h2 className="mb-3 text-3xl font-bold md:text-4xl">
          <span className="text-gold-gradient">Passez au compte Créateur</span>
        </h2>
        <p className="mx-auto max-w-lg text-lg text-muted-foreground">
          Débloquez toutes les fonctionnalités pour partager votre contenu et
          développer votre audience.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div variants={stepItemVariants}>
        <Card className="glass-premium overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="size-5 text-primary" />
              Fonctionnalités Créateur
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="group flex flex-col items-center rounded-xl bg-muted/30 p-4 text-center transition-colors hover:bg-muted/50"
                >
                  <div
                    className={`mb-3 flex size-12 items-center justify-center rounded-full ${feature.bgColor}`}
                  >
                    <Icon className={`size-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-1 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Verification Process */}
      <motion.div variants={stepItemVariants}>
        <Card className="glass-premium overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="size-5 text-primary" />
              Processus de vérification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {verificationSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="relative flex items-start gap-4 pb-6 last:pb-0"
                  >
                    {/* Vertical line */}
                    {index < verificationSteps.length - 1 && (
                      <div className="absolute left-5 top-12 h-full w-px bg-border" />
                    )}
                    <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA Button */}
      <motion.div variants={stepItemVariants} className="pt-2">
        <Button
          onClick={onNext}
          className="btn-premium w-full rounded-full py-6 text-base"
          size="lg"
        >
          Commencer ma candidature
          <ArrowRight className="ml-2 size-5" />
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          En postulant, vous acceptez nos{" "}
          <Link
            href="/terms"
            className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary/60"
          >
            conditions d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link
            href="/privacy"
            className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary/60"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </motion.div>
    </motion.div>
  )
}
