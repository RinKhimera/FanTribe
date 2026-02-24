"use client"

import { motion } from "motion/react"
import { EditProfileForm } from "@/components/shared/edit-profile-form"
import { Doc } from "@/convex/_generated/dataModel"
import { pageVariants } from "@/lib/animations"
import { UpdateImages } from "./update-images"

type EditProfileLayoutProps = {
  currentUser: Doc<"users">
  userProfile: Doc<"users">
  subStatus: Doc<"subscriptions"> | null
}

export const EditProfileLayout = ({
  currentUser,
}: EditProfileLayoutProps) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Editable banner + avatar — edge-to-edge, replaces hero */}
      <UpdateImages currentUser={currentUser} />

      {/* Form section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4"
      >
        <EditProfileForm currentUser={currentUser} />
      </motion.section>
    </motion.div>
  )
}
