"use client"

import { Flag } from "lucide-react"
import { useState } from "react"
import { ReportDialog } from "@/components/shared/report-dialog"
import { Button } from "@/components/ui/button"
import { Id } from "@/convex/_generated/dataModel"

interface UserReportButtonProps {
  userId: Id<"users">
  username?: string
}

export const UserReportButton = ({
  userId,
  username,
}: UserReportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Flag className="h-4 w-4" />
        Signaler
      </Button>
      <ReportDialog
        reportedUserId={userId}
        type="user"
        username={username}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
