"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type UserProfileTabsProps = {
  username: string
}

export const UserProfileTabs = ({ username }: UserProfileTabsProps) => {
  const pathname = usePathname()
  const isGalleryActive = pathname.includes(`/${username}/gallery`)

  return (
    <div className="border-muted sticky top-[53px] z-20 border-b">
      <div className="frosted">
        <div className="grid w-full grid-cols-2">
          <Link
            href={`/${username}`}
            className={cn(
              "flex items-center justify-center py-3 text-sm transition-colors duration-200",
              "hover:bg-primary/5",
              !isGalleryActive
                ? "border-primary border-b-2 font-semibold"
                : "text-muted-foreground"
            )}
          >
            Publications
          </Link>
          <Link
            href={`/${username}/gallery`}
            className={cn(
              "flex items-center justify-center py-3 text-sm transition-colors duration-200",
              "hover:bg-primary/5",
              isGalleryActive
                ? "border-primary border-b-2 font-semibold"
                : "text-muted-foreground"
            )}
          >
            Médias
          </Link>
        </div>
      </div>
    </div>
  )
}
