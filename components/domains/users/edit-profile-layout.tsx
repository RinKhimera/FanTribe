"use client"

import { motion } from "motion/react"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { EditProfileForm } from "@/components/shared/edit-profile-form"
import { ImageUploadInfo } from "@/components/shared/image-upload-info"
import { Button } from "@/components/ui/button"
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
  userProfile,
}: EditProfileLayoutProps) => {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-[500px]:pb-16"
    >
      {/* Sticky header with glass effect */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="frosted sticky top-0 z-30 border-b border-white/10"
      >
        <div className="flex items-center gap-4 px-4 py-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="glass-button size-9 rounded-full"
          >
            <Link href={`/${userProfile?.username}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Modifier le profil</h1>
            <p className="text-muted-foreground text-sm">
              @{userProfile?.username}
            </p>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-4">
        {/* Images section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card overflow-hidden rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" />
              <span className="font-medium">Photos</span>
            </div>
            <ImageUploadInfo />
          </div>
          <UpdateImages currentUser={currentUser} />
        </motion.section>

        {/* Form section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <EditProfileForm currentUser={currentUser} />
        </motion.section>
      </div>
    </motion.main>
  )
}
