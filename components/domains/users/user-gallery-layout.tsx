"use client"

import { useQuery } from "convex/react"
import { Link as LucideLink, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SubscriptionDialog } from "@/components/domains/subscriptions"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { UserGallery } from "./user-gallery"

type UserGalleryLayoutProps = {
  currentUser: Doc<"users">
  userProfile: Doc<"users">
}

export const UserGalleryLayout = ({
  currentUser,
  userProfile,
}: UserGalleryLayoutProps) => {
  const subscriptionStatus = useQuery(api.subscriptions.getFollowSubscription, {
    creatorId: userProfile._id,
    subscriberId: currentUser._id,
  })

  const pathname = usePathname()
  const username = userProfile.username
  const isGalleryActive = pathname.includes(`/${username}/gallery`)

  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-[500px]:pb-16">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        {userProfile?.name}
      </h1>

      <div className="relative">
        <div>
          <AspectRatio ratio={3 / 1} className="bg-muted">
            <Image
              src={
                (userProfile?.imageBanner as string) ||
                "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
              }
              alt={userProfile?.name as string}
              className="object-cover"
              fill
            />
          </AspectRatio>
        </div>
        <div className="absolute -bottom-[65px] left-5 max-sm:-bottom-[38px]">
          <Dialog>
            <DialogTrigger asChild>
              <Avatar className="border-accent size-36 cursor-pointer border-4 object-none object-center max-sm:size-24">
                {userProfile?.image ? (
                  <Image
                    src={userProfile.image}
                    width={600}
                    height={600}
                    className="aspect-square h-full w-full object-cover"
                    alt={userProfile?.name || "Profile image"}
                  />
                ) : (
                  <AvatarFallback className="size-11">
                    <div className="animate-pulse rounded-full bg-gray-500"></div>
                  </AvatarFallback>
                )}
              </Avatar>
            </DialogTrigger>
            <DialogContent className="flex h-screen max-w-none items-center justify-center border-none bg-black/80 p-0 sm:rounded-none">
              <div className="relative max-h-[90vh] max-w-[90vw]">
                {userProfile?.image ? (
                  <Image
                    src={userProfile.image}
                    width={1200}
                    height={1200}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                    alt={userProfile?.name || "Profile image"}
                  />
                ) : (
                  <div className="h-[50vh] w-[50vh] animate-pulse rounded-full bg-gray-500"></div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <>
        {currentUser?.username === userProfile.username ? (
          <div className="mt-4 mr-5 flex justify-end">
            <Button
              asChild
              variant={"outline"}
              className="rounded-3xl border-2"
            >
              <Link href={`/${currentUser.username}/edit`}>
                Modifier le profil
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-[68px]"></div>
        )}
      </>

      <div className="border-muted border-b px-4 py-4">
        <div className="text-2xl font-bold">{userProfile?.name}</div>
        <div className="text-muted-foreground">@{userProfile?.username}</div>

        <div className="mt-3">{userProfile?.bio}</div>
        <div className="text-muted-foreground -ml-0.5 flex items-center gap-1">
          <MapPin size={18} />
          {userProfile?.location}
        </div>

        <>
          {userProfile?.socials?.map((url) => (
            <div
              key={url}
              className="text-muted-foreground -ml-0.5 flex items-center gap-1"
            >
              <LucideLink size={18} />

              <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 hover:underline"
              >
                {url}
              </Link>
            </div>
          ))}
        </>
      </div>

      <>
        {currentUser?.username !== userProfile.username && (
          <div className="border-muted border-b px-4 py-4">
            <div className="text-2xl leading-none font-semibold tracking-tight">
              Abonnement
            </div>
            <div className="mb-1">
              {subscriptionStatus ? (
                (() => {
                  switch (subscriptionStatus.status) {
                    case "expired":
                      return (
                        <SubscriptionDialog
                          userProfile={userProfile}
                          type="renew"
                        />
                      )
                    case "canceled":
                      return (
                        <SubscriptionDialog
                          userProfile={userProfile}
                          type="subscribe"
                        />
                      )
                    case "active":
                      return (
                        <SubscriptionDialog
                          userProfile={userProfile}
                          type="unsubscribe"
                        />
                      )
                    default:
                      return (
                        <SubscriptionDialog
                          userProfile={userProfile}
                          type="subscribe"
                        />
                      )
                  }
                })()
              ) : (
                <SubscriptionDialog
                  userProfile={userProfile}
                  type="subscribe"
                />
              )}
            </div>
          </div>
        )}
      </>

      {/* Navigation tabs pour Posts et Médias */}
      <div className="border-muted border-b">
        <Tabs
          defaultValue={isGalleryActive ? "media" : "posts"}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-none bg-transparent p-0">
            <Link href={`/${username}`} className="w-full">
              <TabsTrigger
                value="posts"
                className={cn(
                  "w-full rounded-none transition-colors duration-200",
                  "hover:bg-primary/10 data-[state=active]:bg-muted/30 cursor-pointer",
                  !isGalleryActive && "border-primary border-b-2",
                )}
              >
                Posts
              </TabsTrigger>
            </Link>
            <Link href={`/${username}/gallery`} className="w-full">
              <TabsTrigger
                value="media"
                className={cn(
                  "w-full rounded-none transition-colors duration-200",
                  "hover:bg-primary/10 data-[state=active]:bg-muted/30 cursor-pointer",
                  isGalleryActive && "border-primary border-b-2",
                )}
              >
                Médias
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
      </div>

      <UserGallery authorId={userProfile._id} currentUser={currentUser} />
    </main>
  )
}
