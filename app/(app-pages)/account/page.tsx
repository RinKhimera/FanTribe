"use client"

import { UserProfile } from "@clerk/nextjs"
import { User } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormSection } from "@/components/shared/profile-form/form-section"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

export default function AccountProfilePage() {
  const [isClerkDialogOpen, setIsClerkDialogOpen] = useState(false)

  return (
    <div className="space-y-6 p-4">
      <FormSection
        icon={<User className="size-5" />}
        title="Informations personnelles"
        delay={0}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Gérez votre profil Clerk : email, mot de passe, authentification à
            deux facteurs
          </p>

          <Dialog open={isClerkDialogOpen} onOpenChange={setIsClerkDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto group relative overflow-hidden"
              >
                {/* Subtle gradient on hover */}
                <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <User className="mr-2 size-4 transition-transform group-hover:scale-110 duration-300" />
                <span className="relative">Ouvrir les paramètres Clerk</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl overflow-hidden p-0">
              <VisuallyHidden>
                <DialogTitle>Paramètres du profil</DialogTitle>
              </VisuallyHidden>

              {/* Decorative gradient header */}
              <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-primary/5 via-primary/3 to-transparent pointer-events-none" />

              <div className="relative">
                <UserProfile
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border-none bg-transparent",
                      navbar: { display: "none" },
                      pageScrollBox: "p-0",
                    },
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FormSection>
    </div>
  )
}
