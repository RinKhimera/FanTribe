"use client"

import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log l'erreur pour le debug
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-[500px]:pb-16">
      <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-lg"
        >
          <ArrowLeft className="size-6" />
          Retour à l&apos;accueil
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="bg-destructive/10 mb-8 flex h-24 w-24 items-center justify-center rounded-full">
          <AlertTriangle className="text-destructive h-12 w-12" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-destructive mb-2 text-6xl font-bold">Oops!</h1>
          <h2 className="text-foreground mb-4 text-2xl font-semibold">
            Une erreur est survenue
          </h2>
          <p className="text-muted-foreground max-w-md">
            Quelque chose s&apos;est mal passé. Cela peut être temporaire,
            essayez de rafraîchir la page ou revenez à l&apos;accueil.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="bg-muted mt-4 max-w-md rounded-lg p-4 text-left text-sm">
              <summary className="text-destructive cursor-pointer font-medium">
                Détails de l&apos;erreur pour les développeurs
              </summary>
              <pre className="mt-2 text-xs wrap-break-word whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
