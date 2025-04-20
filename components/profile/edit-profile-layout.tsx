"use client"

import { Doc } from "@/convex/_generated/dataModel"
import { Label } from "@/components/ui/label"
import { ImageUploadInfo } from "@/components/shared/image-upload-info"
import { UpdateImages } from "@/components/profile/update-images"
import { EditProfileForm } from "../shared/edit-profile-form"

type EditProfileLayoutProps = {
  currentUser: Doc<"users">
  userProfile: Doc<"users">
  subStatus: Doc<"subscriptions"> | null
}

export const EditProfileLayout = ({
  currentUser,
  userProfile,
  subStatus,
}: EditProfileLayoutProps) => {
  return (
    <main className="flex h-full min-h-screen w-[50%] flex-col border-l border-r border-muted max-lg:w-[80%] max-sm:w-full">
      <h1 className="sticky top-0 z-20 border-b border-muted p-4 text-2xl font-bold backdrop-blur">
        {userProfile?.name}
      </h1>

      <div className="flex items-center justify-between px-2">
        <Label>Photo de bannière et de profil</Label>
        <ImageUploadInfo />
      </div>

      <UpdateImages currentUser={currentUser} />

      <EditProfileForm currentUser={currentUser} />
    </main>
  )
}
