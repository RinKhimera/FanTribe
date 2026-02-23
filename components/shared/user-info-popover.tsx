import { SignOutButton } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import {
  CircleUserRound,
  LogOut,
  Settings,
  Sparkles,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

type UserInfoPopoverProps = {
  currentUser: Doc<"users">
  onNavigate?: () => void
  /** Mode compact : affiche uniquement l'avatar (pour tablet) */
  compact?: boolean
}

export const UserInfoPopover = ({
  currentUser,
  onNavigate,
  compact = false,
}: UserInfoPopoverProps) => {
  const router = useRouter()

  const isCreator =
    currentUser.accountType === "CREATOR" ||
    currentUser.accountType === "SUPERUSER"

  const mySubsStats = useQuery(
    api.subscriptions.getMyContentAccessSubscriptionsStats,
    {},
  )
  const mySubscribersStats = useQuery(
    api.subscriptions.getMySubscribersStats,
    isCreator ? {} : "skip",
  )
  const myLikesCount = useQuery(
    api.likes.getMyLikesGivenCount,
    !isCreator ? {} : "skip",
  )

  const handleNavigation = (href: string) => {
    if (onNavigate) {
      onNavigate()
      setTimeout(() => {
        router.push(href)
      }, 150)
    } else {
      router.push(href)
    }
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                // Base styles
                "flex cursor-pointer items-center transition-all duration-200",
                "rounded-xl",
                "hover:bg-foreground/10",
                "data-[state=open]:bg-foreground/10",
                // Mode compact : bouton carré aligné à droite
                compact && [
                  "max-xl:h-12 max-xl:w-12 max-xl:justify-center max-xl:p-0",
                  "xl:w-full xl:justify-between xl:p-3",
                ],
                // Mode normal : toujours full width
                !compact && "w-full justify-between p-3",
              )}
            >
              {/* Avatar + Info */}
              <div
                className={cn(
                  "flex items-center gap-3",
                  compact && "max-xl:gap-0",
                )}
              >
                <Avatar
                  className={cn(
                    "shrink-0 rounded-lg transition-transform duration-200",
                    "group-hover:scale-105",
                    compact ? "size-8 max-xl:size-10" : "size-10",
                  )}
                >
                  {currentUser?.image ? (
                    <AvatarImage
                      src={currentUser.image}
                      alt={currentUser?.username || "Profile image"}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary rounded-lg font-semibold">
                      {currentUser?.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Nom et username (cachés en mode compact sur tablet) */}
                <div
                  className={cn(
                    "grid flex-1 text-left text-sm leading-tight",
                    compact && "max-xl:hidden",
                  )}
                >
                  <span className="text-foreground truncate font-semibold">
                    {currentUser?.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    @{currentUser?.username}
                  </span>
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {/* Tooltip uniquement en mode compact sur tablet */}
        {compact && (
          <TooltipContent side="right" className="xl:hidden" sideOffset={8}>
            <p className="font-medium">{currentUser?.name}</p>
            <p className="text-muted-foreground text-xs">
              @{currentUser?.username}
            </p>
          </TooltipContent>
        )}
      </Tooltip>

      <DropdownMenuContent
        className="border-border/50 bg-popover/95 min-w-60 rounded-xl backdrop-blur-sm"
        align={compact ? "center" : "end"}
        side="top"
        sideOffset={8}
      >
        {/* Header avec avatar et stats */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar className="size-12 rounded-lg">
              {currentUser?.image ? (
                <AvatarImage
                  src={currentUser.image}
                  alt={currentUser?.username || "Profile image"}
                />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary rounded-lg font-semibold">
                  {currentUser?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="text-foreground truncate font-semibold">
                {currentUser?.name}
              </span>
              <span className="text-muted-foreground truncate text-sm">
                @{currentUser?.username}
              </span>
            </div>
          </div>

          {/* Stats — different for creators vs users */}
          <div className="border-border/50 flex items-center gap-4 border-t px-3 py-2 text-sm">
            {isCreator ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-semibold">
                    {mySubscribersStats?.subscribersCount || 0}
                  </span>
                  <span className="text-muted-foreground">
                    fan{(mySubscribersStats?.subscribersCount || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="bg-border/50 h-4 w-px" />
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-semibold">
                    {mySubsStats?.creatorsCount || 0}
                  </span>
                  <span className="text-muted-foreground">
                    abonnement{(mySubsStats?.creatorsCount || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-semibold">
                    {mySubsStats?.creatorsCount || 0}
                  </span>
                  <span className="text-muted-foreground">
                    abonnement{(mySubsStats?.creatorsCount || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="bg-border/50 h-4 w-px" />
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-semibold">
                    {myLikesCount?.count || 0}
                  </span>
                  <span className="text-muted-foreground">j&apos;aime</span>
                </div>
              </>
            )}
          </div>
        </DropdownMenuLabel>

        {/* Option créateur - uniquement visible pour les utilisateurs non-créateurs */}
        {currentUser.accountType !== "CREATOR" &&
          currentUser.accountType !== "SUPERUSER" && (
            <>
              <DropdownMenuSeparator className="bg-border/50" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="focus:bg-primary/10 cursor-pointer rounded-lg px-3 py-2.5"
                  onClick={() => handleNavigation("/be-creator")}
                >
                  <Sparkles className="text-primary mr-3 size-4" />
                  <span>Passer au compte Créateur</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

        <DropdownMenuSeparator className="bg-border/50" />

        {/* Liens de navigation */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="focus:bg-foreground/10 cursor-pointer rounded-lg px-3 py-2.5"
            onClick={() => handleNavigation(`/${currentUser?.username}`)}
          >
            <CircleUserRound className="text-muted-foreground mr-3 size-4" />
            <span>Profil</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="focus:bg-foreground/10 cursor-pointer rounded-lg px-3 py-2.5"
            onClick={() => handleNavigation("/subscriptions")}
          >
            <Users className="text-muted-foreground mr-3 size-4" />
            <span>Abonnements</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="focus:bg-foreground/10 cursor-pointer rounded-lg px-3 py-2.5"
            onClick={() => handleNavigation("/account")}
          >
            <Settings className="text-muted-foreground mr-3 size-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border/50" />

        {/* Déconnexion */}
        <SignOutButton>
          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg px-3 py-2.5">
            <LogOut className="mr-3 size-4" />
            <span>Se déconnecter</span>
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
