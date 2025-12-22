"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PageContainer } from "@/components/layout"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, isLoading } = useCurrentUser()
  const router = useRouter()

  // Redirection si l'utilisateur n'est pas superuser (restriction temporaire en dev)
  useEffect(() => {
    if (!isLoading && currentUser && currentUser.accountType !== "SUPERUSER") {
      router.push("/")
    }
  }, [currentUser, isLoading, router])

  // État de chargement
  if (isLoading || currentUser === undefined) {
    return (
      <PageContainer variant="wide" hideHeader>
        <div className="flex h-full min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
            <p className="text-muted-foreground text-lg">
              Vérification des permissions...
            </p>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Redirection en cours pour les utilisateurs non autorisés
  if (!currentUser || currentUser.accountType !== "SUPERUSER") {
    return (
      <PageContainer variant="wide" hideHeader>
        <div className="flex h-full min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
            <p className="text-muted-foreground text-lg">
              Redirection en cours...
            </p>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Rendu des pages messages si les permissions sont OK
  return <>{children}</>
}
