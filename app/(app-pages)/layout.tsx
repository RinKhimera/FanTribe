"use client"

import { Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { AppLayout } from "@/components/layout"
import { BannedUserScreen } from "@/components/shared/banned-user-screen"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { usePresence } from "@/hooks/usePresence"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUser, isLoading } = useCurrentUser()
  const isFirstRender = useRef(true)

  // Scroll to top on route change (shared layouts keep scroll position)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo(0, 0)
  }, [pathname])

  // Start presence tracking (heartbeat every 2 minutes)
  usePresence()

  // État de chargement pendant l'auth ou le chargement de l'utilisateur
  if (isLoading || currentUser === undefined) {
    return (
      <section>
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground text-lg">Chargement…</p>
          </div>
        </div>
      </section>
    )
  }

  // Redirection vers l'onboarding si pas de username (profil incomplet)
  if (!currentUser?.username) {
    router.push("/onboarding")
    return null
  }

  // Si currentUser est null après le chargement, erreur
  if (!currentUser) {
    return (
      <section>
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground text-lg">
              Erreur de chargement du profil…
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Vérifier si l'utilisateur est banni
  if (currentUser.isBanned && "activeBan" in currentUser && currentUser.activeBan) {
    return (
      <BannedUserScreen
        banInfo={{
          type: currentUser.activeBan.type as "temporary" | "permanent",
          reason: currentUser.activeBan.reason,
          bannedAt: currentUser.activeBan.bannedAt,
          expiresAt: currentUser.activeBan.expiresAt,
        }}
      />
    )
  }

  return <AppLayout currentUser={currentUser}>{children}</AppLayout>
}
