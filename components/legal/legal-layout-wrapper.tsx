"use client"

import { useCurrentUser } from "@/hooks/useCurrentUser"
import { AppLayout } from "@/components/layout/app-layout"
import { PageContainer } from "@/components/layout/page-container"
import { LegalGuestLayout } from "./legal-guest-layout"
import { LegalNavigation } from "./legal-navigation"
import { cn } from "@/lib/utils"

type LegalLayoutWrapperProps = {
  children: React.ReactNode
}

export const LegalLayoutWrapper = ({ children }: LegalLayoutWrapperProps) => {
  const { currentUser, isLoading, isAuthenticated } = useCurrentUser()

  // Loading state - minimal skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center",
          "bg-background",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "h-8 w-8 animate-spin rounded-full",
              "border-2 border-muted",
              "border-t-primary",
            )}
          />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Authenticated user with complete profile
  if (isAuthenticated && currentUser?.username) {
    return (
      <AppLayout currentUser={currentUser} hideRightSidebar>
        <PageContainer
          title="Informations légales"
          headerContent={<LegalNavigation />}
          variant="wide"
        >
          <div className="p-4 sm:p-6">{children}</div>
        </PageContainer>
      </AppLayout>
    )
  }

  // Guest or user without profile
  return <LegalGuestLayout>{children}</LegalGuestLayout>
}
