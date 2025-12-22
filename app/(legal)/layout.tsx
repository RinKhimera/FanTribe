import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const LegalLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border/50 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="FanTribe Logo"
              width={120}
              height={120}
            />
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Se connecter
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm" className="rounded-full">
                S&apos;inscrire
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/"
          className="group text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Retour à l&apos;accueil
        </Link>

        {/* Content card */}
        <div className="border-border/50 bg-card/50 rounded-2xl border p-6 shadow-lg shadow-black/5 backdrop-blur-sm sm:p-8 lg:p-10 dark:shadow-black/20">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border/50 border-t py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} FanTribe. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Conditions d&apos;utilisation
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LegalLayout
