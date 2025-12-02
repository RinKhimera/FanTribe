import { SignUp } from "@clerk/nextjs"
import { ArrowRight, Heart, Rocket, Star, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const SignUpPage = () => {
  return (
    <div className="relative min-h-screen w-full">
      {/* Image de fond pour mobile */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="/images/bg-login.webp"
          alt="Background"
          className="object-cover"
          priority
          fill
        />
        <div className="from-background/95 via-background/90 to-background/95 absolute inset-0 bg-gradient-to-b" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* Panneau gauche - Image et branding (desktop) */}
        <div className="relative hidden lg:flex lg:flex-col">
          {/* Image de fond */}
          <div className="absolute inset-0">
            <Image
              src="/images/bg-login.webp"
              alt="Background"
              className="object-cover"
              priority
              fill
            />
          </div>

          {/* Overlay avec dégradé */}
          <div className="to-primary/30 absolute inset-0 bg-gradient-to-br from-black/70 via-black/50" />

          {/* Contenu */}
          <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-12">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.svg"
                alt="FanTribe Logo"
                width={180}
                height={180}
                className="drop-shadow-lg"
              />
            </div>

            {/* Avantages */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl backdrop-blur-sm">
                  <Rocket className="text-primary-foreground h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Lancez-vous</h3>
                  <p className="text-sm text-white/70">
                    Créez votre profil en quelques minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl backdrop-blur-sm">
                  <Heart className="text-primary-foreground h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    Soutenez vos créateurs
                  </h3>
                  <p className="text-sm text-white/70">
                    Accédez à des contenus exclusifs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl backdrop-blur-sm">
                  <Zap className="text-primary-foreground h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    Monétisez votre talent
                  </h3>
                  <p className="text-sm text-white/70">
                    Devenez créateur et gagnez de l&apos;argent
                  </p>
                </div>
              </div>
            </div>

            {/* Témoignage */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <blockquote className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-lg leading-relaxed text-white/90">
                  &ldquo;Un outil formidable pour connecter avec les fans et
                  monétiser efficacement ma créativité à travers des contenus
                  uniques.&rdquo;
                </p>
                <footer className="flex items-center gap-3">
                  <div className="from-primary to-primary/50 h-10 w-10 rounded-full bg-gradient-to-br" />
                  <div>
                    <p className="font-medium text-white">Léandra Njoya</p>
                    <p className="text-sm text-white/60">
                      Créatrice de contenu
                    </p>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>

        {/* Panneau droit - Formulaire */}
        <div className="relative flex flex-col">
          {/* Header avec navigation */}
          <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8">
            {/* Logo mobile */}
            <div className="lg:hidden">
              <Image
                src="/images/logo.svg"
                alt="FanTribe Logo"
                width={120}
                height={120}
              />
            </div>
            <div className="hidden lg:block" />

            {/* Bouton connexion */}
            <Link href="/auth/sign-in">
              <Button
                variant="outline"
                className="group border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 gap-2 rounded-full px-4"
              >
                <span className="text-sm">Se connecter</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          {/* Zone du formulaire */}
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 sm:px-6 lg:px-8">
            {/* Titre et description */}
            <div className="mb-8 w-full max-w-[400px] text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Rejoignez FanTribe
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Créez votre compte et accédez à un monde de contenus exclusifs
              </p>
            </div>

            {/* Clerk SignUp Component */}
            <div className="w-full max-w-[400px]">
              <div className="border-border/50 bg-card/80 dark:border-border/30 dark:bg-card/50 overflow-hidden rounded-2xl border shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
                <SignUp
                  path="/auth/sign-up"
                  forceRedirectUrl="/onboarding"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none bg-transparent border-0 w-full",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border-border/50 bg-background/50 hover:bg-accent transition-all duration-200",
                      socialButtonsBlockButtonText: "font-medium",
                      dividerLine: "bg-border/50",
                      dividerText: "text-muted-foreground",
                      formFieldLabel: "text-foreground font-medium",
                      formFieldInput:
                        "rounded-xl border-border/50 bg-background/50 focus:border-primary focus:ring-primary/20 transition-all duration-200",
                      formButtonPrimary:
                        "bg-primary hover:bg-primary/90 rounded-xl h-11 text-base font-semibold transition-all duration-200 shadow-lg shadow-primary/25",
                      footerActionLink:
                        "text-primary hover:text-primary/80 font-medium",
                      identityPreviewEditButton: "text-primary",
                      formFieldAction: "text-primary hover:text-primary/80",
                      alertText: "text-destructive",
                      formFieldInputShowPasswordButton: "text-muted-foreground",
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      socialButtonsVariant: "blockButton",
                    },
                  }}
                />
              </div>
            </div>

            {/* Footer mobile */}
            <p className="text-muted-foreground mt-8 text-center text-xs lg:hidden">
              En vous inscrivant, vous acceptez nos{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Conditions d&apos;utilisation
              </Link>{" "}
              et notre{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Politique de confidentialité
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
