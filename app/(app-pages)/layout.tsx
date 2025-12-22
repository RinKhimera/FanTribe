"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { currentUser, isLoading } = useCurrentUser()

  // État de chargement pendant l'auth ou le chargement de l'utilisateur
  if (isLoading || currentUser === undefined) {
    return (
      <section>
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
            <p className="text-muted-foreground text-lg">Chargement...</p>
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
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
            <p className="text-muted-foreground text-lg">
              Erreur de chargement du profil...
            </p>
          </div>
        </div>
      </section>
    )
  }

  return <AppLayout currentUser={currentUser}>{children}</AppLayout>
}
