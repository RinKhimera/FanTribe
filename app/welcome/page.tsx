"use client"

import { useQuery } from "convex/react"
import { ArrowRight, Loader2, Lock, Rss, Star } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FollowButton } from "@/components/domains/users/follow-button"
import { SuggestionCard } from "@/components/shared/suggestions/suggestion-card"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

const TIPS = [
  {
    icon: Rss,
    title: "Découvrez des créateurs",
    description:
      "Explorez des centaines de créateurs de contenu talentueux et trouvez ceux qui vous inspirent.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Lock,
    title: "Contenu exclusif",
    description:
      "Abonnez-vous à vos créateurs préférés pour accéder à du contenu exclusif réservé aux abonnés.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Star,
    title: "Soutenez par des pourboires",
    description:
      "Encouragez les créateurs que vous aimez en leur envoyant un pourboire directement via mobile money.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
]

const WelcomePage = () => {
  const router = useRouter()
  const { currentUser, isLoading, isAuthenticated } = useCurrentUser()
  // Skip the query until authenticated to avoid "Not authenticated" ConvexError
  const suggestedCreators = useQuery(
    api.users.getSuggestedCreators,
    isAuthenticated ? {} : "skip",
  )

  // Guard: must have completed onboarding
  useEffect(() => {
    if (isLoading || currentUser === undefined) return
    if (!currentUser) {
      router.push("/auth/sign-in")
      return
    }
    if (!currentUser.username) {
      router.push("/onboarding")
      return
    }
  }, [isLoading, currentUser, router])

  // Don't show welcome again if user navigates back (use localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenWelcome", "true")
    }
  }, [])

  if (isLoading || currentUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
      </div>
    )
  }

  if (!currentUser?.username) return null

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-2xl px-4 py-10">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="bg-primary/10 mb-4 inline-flex size-20 items-center justify-center rounded-full text-4xl"
          >
            🎉
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight max-sm:text-2xl">
            Bienvenue sur FanTribe,{" "}
            <span className="text-gold-gradient">{currentUser.name}</span> !
          </h1>
          <p className="text-muted-foreground mt-3 text-base">
            Votre profil est prêt. Découvrez tout ce que FanTribe a à vous
            offrir.
          </p>
        </motion.div>

        {/* Quick tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {TIPS.map(({ icon: Icon, title, description, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className="glass-card flex flex-col gap-3 rounded-2xl p-5"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${bg}`}
              >
                <Icon className={`size-5 ${color}`} />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Suggested creators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-lg font-semibold">Créateurs à découvrir</h2>

          {suggestedCreators === undefined && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          )}

          {suggestedCreators && suggestedCreators.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {suggestedCreators.slice(0, 6).map((creator, index) => (
                  <div key={creator._id} className="relative">
                    <SuggestionCard
                      user={creator}
                      variant="default"
                      index={index}
                    />
                    <div className="absolute right-3 bottom-3 z-10">
                      <FollowButton
                        targetUserId={creator._id}
                        variant="compact"
                      />
                    </div>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {suggestedCreators && suggestedCreators.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Aucun créateur disponible pour l&apos;instant — revenez bientôt !
            </p>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/")}
            className="btn-premium flex cursor-pointer items-center gap-2 rounded-2xl px-10 py-3 text-base font-semibold shadow-lg"
          >
            Commencer à explorer
            <ArrowRight className="size-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default WelcomePage
