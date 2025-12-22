"use client"

import { ArrowLeft, Home, UserX } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
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
        <div className="bg-muted mb-8 flex h-24 w-24 items-center justify-center rounded-full">
          <UserX className="text-muted-foreground h-12 w-12" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-primary mb-2 text-6xl font-bold">404</h1>
          <h2 className="text-foreground mb-4 text-2xl font-semibold">
            Page introuvable
          </h2>
          <p className="text-muted-foreground max-w-md">
            La page que vous recherchez n&apos;existe pas ou a été supprimée.
            Vérifiez le nom d&apos;utilisateur ou explorez d&apos;autres
            profils.
          </p>
        </div>

        <div>
          <Button asChild size="lg" className="gap-2">
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
