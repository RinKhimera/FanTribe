"use client"

import { UpdateImages } from "@/components/profile/update-images"
import { ImageUploadInfo } from "@/components/shared/image-upload-info"
import { Label } from "@/components/ui/label"
import { Doc } from "@/convex/_generated/dataModel"
import { EditProfileForm } from "../shared/edit-profile-form"

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
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-[500px]:pb-16 max-lg:w-[80%] max-sm:w-full">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
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
