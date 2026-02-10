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

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/sign-in")
    }
  }, [currentUser, isLoading, router])

  // État de chargement
  if (isLoading || currentUser === undefined) {
    return (
      <PageContainer variant="wide" hideHeader>
        <div className="flex h-full min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground text-lg">Chargement…</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Redirection en cours si non connecté
  if (!currentUser) {
    return (
      <PageContainer variant="wide" hideHeader>
        <div className="flex h-full min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground text-lg">
              Redirection vers la connexion…
            </p>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Rendu des pages messages si l'utilisateur est connecté
  return <>{children}</>
}
