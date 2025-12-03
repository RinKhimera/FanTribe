import { SignOutButton } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import {
  BookmarkPlus,
  ChevronsUpDown,
  CircleUserRound,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"

export const UserInfoPopover = ({
  currentUser,
  onNavigate,
}: {
  currentUser: Doc<"users">
  onNavigate?: () => void
}) => {
  const router = useRouter()

  const mySubsStats = useQuery(
    api.subscriptions.getMyContentAccessSubscriptionsStats,
    {},
  )
  const mySubscribersStats = useQuery(
    api.subscriptions.getMySubscribersStats,
    {},
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
      <DropdownMenuTrigger asChild>
        <button className="hover:bg-foreground/10 data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground mb-4 flex w-full cursor-pointer items-center justify-between rounded-lg p-3 transition duration-200">
          <div className="flex items-center gap-2">
            <Avatar className="size-8 rounded-lg">
              {currentUser?.image ? (
                <AvatarImage
                  src={currentUser.image}
                  width={100}
                  height={100}
                  className="aspect-square h-full w-full object-cover"
                  alt={currentUser?.username || "Profile image"}
                />
              ) : (
                <AvatarFallback className="rounded-lg">
                  {currentUser?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {currentUser?.name}
              </span>
              <span className="text-muted-foreground truncate text-sm">
                @{currentUser?.username}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[232px] rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-8 rounded-lg">
              {currentUser?.image ? (
                <AvatarImage
                  src={currentUser.image}
                  width={100}
                  height={100}
                  className="aspect-square h-full w-full object-cover"
                  alt={currentUser?.username || "Profile image"}
                />
              ) : (
                <AvatarFallback className="rounded-lg">
                  {currentUser?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {currentUser?.name}
              </span>
              <span className="truncate text-sm">@{currentUser?.username}</span>
            </div>
          </div>
          <div className="mt-2 px-2 text-sm">
            {mySubscribersStats?.subscribersCount || 0} fans |{" "}
            {mySubsStats?.creatorsCount || 0} abonnements
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles className="mr-2 size-4 text-white" />
            Passer au compte Créateur
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Button
            variant="ghost"
            className="h-auto w-full justify-start p-0"
            onClick={() => handleNavigation(`/${currentUser?.username}`)}
          >
            <DropdownMenuItem className="w-full cursor-pointer">
              <CircleUserRound className="mr-2 size-4 text-white" />
              Profil
            </DropdownMenuItem>
          </Button>

          <Button
            variant="ghost"
            className="h-auto w-full justify-start p-0"
            onClick={() => handleNavigation("/collections")}
          >
            <DropdownMenuItem className="w-full cursor-pointer">
              <BookmarkPlus className="mr-2 size-4 text-white" />
              Collections
            </DropdownMenuItem>
          </Button>

          <Button
            variant="ghost"
            className="h-auto w-full justify-start p-0"
            onClick={() => handleNavigation("/account")}
          >
            <DropdownMenuItem className="w-full cursor-pointer">
              <Settings className="mr-2 size-4 text-white" />
              Compte
            </DropdownMenuItem>
          </Button>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOutButton>
          <DropdownMenuItem className="cursor-pointer">
            <LogOut className="mr-2 size-4 text-white" />
            Se déconnecter
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
