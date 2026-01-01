"use client"

import { Doc } from "@/convex/_generated/dataModel"
import { SubscriptionUnified } from "./subscription-unified"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  creator: Doc<"users">
  currentUser: Doc<"users">
}

/**
 * @deprecated Use SubscriptionUnified directly for new code
 * This component is kept for backward compatibility
 */
export const SubscriptionModal = ({
  isOpen,
  onClose,
  creator,
  currentUser,
}: SubscriptionModalProps) => {
  return (
    <SubscriptionUnified
      isOpen={isOpen}
      onClose={onClose}
      creator={creator}
      currentUser={currentUser}
      type="subscribe"
    />
  )
}
