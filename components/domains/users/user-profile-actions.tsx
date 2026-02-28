"use client"

import { useMutation, useQuery } from "convex/react"
import {
  Ban,
  CheckCircle,
  EllipsisVertical,
  Flag,
  Link2,
  LoaderCircle,
  Pencil,
  Share2,
  ShieldOff,
  UserCheck,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { ReportDialog } from "@/components/shared/report-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"

type UserProfileActionsProps = {
  currentUser: Doc<"users"> | null | undefined
  userProfile: Doc<"users">
}

export const UserProfileActions = ({
  currentUser,
  userProfile,
}: UserProfileActionsProps) => {
  const isOwnProfile = currentUser?.username === userProfile.username
  const isFollowable =
    !isOwnProfile &&
    (userProfile.accountType === "CREATOR" ||
      userProfile.accountType === "SUPERUSER")

  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isBlockLoading, setIsBlockLoading] = useState(false)

  const followMutation = useMutation(api.follows.followUser)
  const unfollowMutation = useMutation(api.follows.unfollowUser)
  const blockMutation = useMutation(api.blocks.blockUser)
  const unblockMutation = useMutation(api.blocks.unblockUser)

  const isFollowing = useQuery(
    api.follows.isFollowing,
    !isOwnProfile && currentUser ? { targetUserId: userProfile._id } : "skip",
  )
  const blockStatus = useQuery(
    api.blocks.isBlocked,
    !isOwnProfile && currentUser ? { targetUserId: userProfile._id } : "skip",
  )

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${userProfile.username}`
      : ""

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      toast.success("Lien copié !", {
        description: "Le lien du profil a été copié dans le presse-papier",
        icon: <CheckCircle className="size-4" />,
      })
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: userProfile.name || userProfile.username,
          url: profileUrl,
        })
        .catch(() => {
          handleCopyLink()
        })
    } else {
      handleCopyLink()
    }
  }

  const handleFollowToggle = async () => {
    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        await unfollowMutation({ targetUserId: userProfile._id })
        toast.success("Vous ne suivez plus ce créateur")
      } else {
        await followMutation({ targetUserId: userProfile._id })
        toast.success("Vous suivez maintenant ce créateur")
      }
    } catch {
      toast.error("Une erreur s'est produite")
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleBlock = async () => {
    setIsBlockLoading(true)
    try {
      await blockMutation({ targetUserId: userProfile._id })
      toast.success("Utilisateur bloqué", {
        description: "Vous ne verrez plus ses publications",
      })
    } catch {
      toast.error("Une erreur s'est produite")
    } finally {
      setIsBlockLoading(false)
      setShowBlockDialog(false)
    }
  }

  const handleUnblock = async () => {
    setIsBlockLoading(true)
    try {
      await unblockMutation({ targetUserId: userProfile._id })
      toast.success("Utilisateur débloqué")
    } catch {
      toast.error("Une erreur s'est produite")
    } finally {
      setIsBlockLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-9 rounded-full"
          aria-label="Actions du profil"
        >
          <EllipsisVertical className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Own profile actions */}
        {isOwnProfile && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/${currentUser?.username}/edit`}>
                <Pencil className="mr-2 size-4" aria-hidden="true" />
                Modifier le profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Share actions (available for everyone) */}
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="mr-2 size-4" aria-hidden="true" />
          Copier le lien du profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="mr-2 size-4" aria-hidden="true" />
          Partager le profil
        </DropdownMenuItem>

        {/* Other user actions */}
        {!isOwnProfile && currentUser && (
          <>
            {/* Follow/Unfollow — creators and superusers only */}
            {isFollowable && isFollowing !== undefined && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                >
                  {isFollowing ? (
                    <UserCheck className="mr-2 size-4" aria-hidden="true" />
                  ) : (
                    <UserPlus className="mr-2 size-4" aria-hidden="true" />
                  )}
                  {isFollowing ? "Ne plus suivre" : "Suivre"}
                </DropdownMenuItem>
              </>
            )}

            {/* Block/Unblock */}
            {blockStatus && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {blockStatus.iBlocked ? (
                    <DropdownMenuItem
                      onClick={handleUnblock}
                      disabled={isBlockLoading}
                    >
                      <ShieldOff className="mr-2 size-4" aria-hidden="true" />
                      Débloquer
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setShowBlockDialog(true)}
                    >
                      <Ban className="mr-2 size-4" aria-hidden="true" />
                      Bloquer
                    </DropdownMenuItem>
                  )}

                  {/* Report */}
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setShowReportDialog(true)}
                  >
                    <Flag className="mr-2 size-4" aria-hidden="true" />
                    Signaler
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>

      {/* Block confirmation dialog — rendered outside dropdown */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cet utilisateur ne pourra plus voir votre profil ni vos
              publications. Vous ne verrez plus les siennes non plus. Les
              abonnements mutuels seront maintenus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={isBlockLoading}>
              {isBlockLoading ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                "Bloquer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report dialog — rendered outside dropdown */}
      {!isOwnProfile && (
        <ReportDialog
          reportedUserId={userProfile._id}
          type="user"
          username={userProfile.username}
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </DropdownMenu>
  )
}
