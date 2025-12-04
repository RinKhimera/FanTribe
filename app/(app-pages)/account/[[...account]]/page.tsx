import { UserProfile } from "@clerk/nextjs"

const AccountPage = () => {
  return (
    <main className="border-muted flex h-full min-h-screen w-full max-w-3xl flex-col border-r border-l max-[500px]:pb-16">
      <h1 className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Compte
      </h1>
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
    </main>
  )
}

export default AccountPage
