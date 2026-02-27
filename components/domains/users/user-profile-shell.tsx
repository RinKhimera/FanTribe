"use client"

import { Preloaded, usePreloadedQuery, useMutation, useQuery } from "convex/react"
import { Ban, Loader2, ShieldOff } from "lucide-react"
import { notFound, usePathname } from "next/navigation"
import { createContext, use, useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/layout"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { UserProfileHeader } from "./user-profile-header"
import { UserProfileHero } from "./user-profile-hero"
import { UserProfileTabs } from "./user-profile-tabs"

type UserProfileContextValue = {
  userProfile: Doc<"users">
  currentUser: Doc<"users"> | null
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null)

export const useUserProfileContext = () => use(UserProfileContext)

type UserProfileShellProps = {
  preloadedProfile: Preloaded<typeof api.users.getUserProfile>
  preloadedCurrentUser: Preloaded<typeof api.users.getCurrentUser>
  username: string
  children: React.ReactNode
}

export function UserProfileShell({
  preloadedProfile,
  preloadedCurrentUser,
  username,
  children,
}: UserProfileShellProps) {
  const userProfile = usePreloadedQuery(preloadedProfile)
  const currentUser = usePreloadedQuery(preloadedCurrentUser)
  const pathname = usePathname()

  // Detect if we're on a post detail page or edit page
  const isPostPage = pathname.includes("/post/")
  const isEditPage = pathname.endsWith("/edit")

  const subscriptionStatus = useQuery(
    api.subscriptions.getFollowSubscription,
    userProfile && currentUser
      ? {
          creatorId: userProfile._id,
          subscriberId: currentUser._id,
        }
      : "skip",
  )

  if (userProfile === undefined) {
    return (
      <PageContainer hideHeader>
        <div className="flex h-screen flex-col items-center justify-center">
          <Loader2
            className="text-primary h-8 w-8 animate-spin"
            aria-hidden="true"
          />
          <p className="text-muted-foreground mt-4 text-sm">Chargement…</p>
        </div>
      </PageContainer>
    )
  }

  if (userProfile === null) notFound()

  // Check block status
  const blockStatus = userProfile.blockStatus
  const isBlocked = blockStatus?.iBlocked || blockStatus?.blockedMe

  // For post pages, also respect block status
  if (isPostPage && isBlocked) {
    return (
      <PageContainer hideHeader>
        <BlockedProfileState
          blockStatus={blockStatus}
          userProfile={userProfile}
        />
      </PageContainer>
    )
  }

  if (isPostPage) {
    return <PageContainer hideHeader>{children}</PageContainer>
  }

  // Show blocked state instead of profile content
  if (isBlocked) {
    return (
      <PageContainer hideHeader>
        <UserProfileHeader
          userProfile={userProfile}
          currentUser={currentUser}
          isEditPage={false}
        />
        <BlockedProfileState
          blockStatus={blockStatus}
          userProfile={userProfile}
        />
      </PageContainer>
    )
  }

  return (
    <UserProfileContext.Provider
      value={{ userProfile, currentUser: currentUser ?? null }}
    >
      <PageContainer hideHeader>
        <UserProfileHeader
          userProfile={userProfile}
          currentUser={currentUser}
          isEditPage={isEditPage}
        />
        {!isEditPage && (
          <>
            <UserProfileHero
              currentUser={currentUser}
              userProfile={userProfile}
              subscriptionStatus={subscriptionStatus}
            />
            <UserProfileTabs username={username} accountType={userProfile.accountType} />
          </>
        )}
        {children}
      </PageContainer>
    </UserProfileContext.Provider>
  )
}

// ============================================================================
// Blocked Profile State
// ============================================================================

type BlockedProfileStateProps = {
  blockStatus: { iBlocked: boolean; blockedMe: boolean }
  userProfile: { _id: Id<"users">; name: string }
}

function BlockedProfileState({
  blockStatus,
  userProfile,
}: BlockedProfileStateProps) {
  const unblockUser = useMutation(api.blocks.unblockUser)
  const [isUnblocking, setIsUnblocking] = useState(false)

  const iBlockedThem = blockStatus.iBlocked

  const handleUnblock = async () => {
    setIsUnblocking(true)
    try {
      await unblockUser({ targetUserId: userProfile._id })
      toast.success("Utilisateur débloqué", {
        description: `${userProfile.name} a été débloqué`,
      })
    } catch {
      toast.error("Erreur lors du déblocage")
    } finally {
      setIsUnblocking(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-w-sm flex-col items-center text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 260,
            damping: 22,
          }}
          className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-muted"
        >
          {iBlockedThem ? (
            <ShieldOff
              className="text-muted-foreground size-10"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ) : (
            <Ban
              className="text-muted-foreground size-10"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-2 text-lg font-semibold tracking-tight"
        >
          {iBlockedThem
            ? "Vous avez bloqué cet utilisateur"
            : "Ce contenu n\u2019est pas disponible"}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-muted-foreground text-sm leading-relaxed"
        >
          {iBlockedThem
            ? "Vous ne pouvez pas voir son contenu tant que vous ne l\u2019avez pas débloqué."
            : "Ce profil n\u2019est pas accessible."}
        </motion.p>

        {iBlockedThem && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-6"
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isUnblocking}
                >
                  {isUnblocking ? (
                    <Loader2
                      aria-hidden="true"
                      className="mr-2 size-4 animate-spin"
                    />
                  ) : (
                    <ShieldOff
                      aria-hidden="true"
                      className="mr-2 size-4"
                    />
                  )}
                  Débloquer {userProfile.name}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Débloquer {userProfile.name} ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette personne pourra à nouveau voir votre contenu et
                    vous envoyer des messages.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUnblock}>
                    Débloquer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        )}

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="via-border mt-8 h-px w-24 bg-linear-to-r from-transparent to-transparent"
        />
      </motion.div>
    </div>
  )
}
