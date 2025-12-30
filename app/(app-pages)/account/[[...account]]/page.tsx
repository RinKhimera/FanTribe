import { UserProfile } from "@clerk/nextjs"
import { PageContainer } from "@/components/layout"

const AccountPage = () => {
  return (
    <PageContainer title="Compte" className="max-w-3xl">
      {/* Container pour UserProfile avec scroll si débordement */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-2 sm:p-4">
        <UserProfile
          path="/account"
          routing="path"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-none bg-transparent",
              cardBox: "shadow-none",
              navbar: "bg-card/50 rounded-lg",
              navbarButton: "text-foreground",
              pageScrollBox: "p-0",
            },
          }}
        />
      </div>
    </PageContainer>
  )
}

export default AccountPage
