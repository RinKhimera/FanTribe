"use client"

import { UserProfile } from "@clerk/nextjs"
import { ChevronRight, Link2, Mail, User } from "lucide-react"
import { useState } from "react"
import { FormSection } from "@/components/shared/profile-form/form-section"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { cn } from "@/lib/utils"

const profileSections = [
  {
    icon: User,
    label: "Profil",
    description: "Modifiez votre nom et votre photo de profil",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  {
    icon: Mail,
    label: "Adresses e-mail",
    description:
      "Ajoutez ou supprimez des adresses e-mail liées à votre compte",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
  },
  {
    icon: Link2,
    label: "Comptes connectés",
    description: "Gérez vos connexions avec Google et d\u2019autres services",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
]

export default function AccountProfilePage() {
  const [isClerkDialogOpen, setIsClerkDialogOpen] = useState(false)

  return (
    <div className="space-y-6 p-4">
      <FormSection
        icon={<User className="size-5" />}
        title="Informations personnelles"
        delay={0}
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          Gérez votre profil, vos adresses e-mail et vos comptes connectés
          depuis votre espace Clerk.
        </p>

        <div className="space-y-2">
          {profileSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.label}
                type="button"
                onClick={() => setIsClerkDialogOpen(true)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl p-4",
                  "border transition-all duration-300",
                  "hover:bg-muted/50 focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "group cursor-pointer",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105",
                    section.iconBg,
                  )}
                >
                  <Icon className={cn("size-5", section.iconColor)} />
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium">{section.label}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {section.description}
                  </p>
                </div>

                <ChevronRight className="text-muted-foreground/50 size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            )
          })}
        </div>
      </FormSection>

      <Dialog open={isClerkDialogOpen} onOpenChange={setIsClerkDialogOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <VisuallyHidden>
            <DialogTitle>Paramètres du profil</DialogTitle>
          </VisuallyHidden>

          {/* Decorative gradient header */}
          <div className="from-primary/5 via-primary/3 pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b to-transparent" />

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
  )
}
