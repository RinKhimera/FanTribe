"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function SuperuserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, isLoading } = useCurrentUser()
  const router = useRouter()

  // Redirection si l'utilisateur n'est pas superuser
  useEffect(() => {
    if (!isLoading && currentUser && currentUser.accountType !== "SUPERUSER") {
      router.push("/")
    }
  }, [currentUser, isLoading, router])

  // État de chargement
  if (isLoading || currentUser === undefined) {
    return (
      <div className="border-muted flex h-full min-h-screen w-full items-center justify-center border-r border-l">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">
            Vérification des permissions...
          </p>
        </div>
      </div>
    )
  }

  // Redirection en cours pour les utilisateurs non autorisés
  if (!currentUser || currentUser.accountType !== "SUPERUSER") {
    return (
      <div className="border-muted flex h-full min-h-screen w-full items-center justify-center border-r border-l">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">
            Redirection en cours...
          </p>
        </div>
      </div>
    )
  }

  // Rendu des pages superuser si les permissions sont OK
  return <>{children}</>
}
