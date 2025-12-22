"use client"

import { Flag } from "lucide-react"
import { ReportDialog } from "@/components/shared/report-dialog"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Id } from "@/convex/_generated/dataModel"

interface UserReportButtonProps {
  userId: Id<"users">
  username?: string
}

export const UserReportButton = ({
  userId,
  username,
}: UserReportButtonProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Flag className="h-4 w-4" />
          Signaler
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1">
        <ReportDialog
          reportedUserId={userId}
          type="user"
          triggerText="Signaler cet utilisateur"
          username={username}
        />
      </PopoverContent>
    </Popover>
  )
}
