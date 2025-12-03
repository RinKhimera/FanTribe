import { UserProfile } from "@clerk/nextjs"

const AccountPage = () => {
  return (
    <main className="border-muted flex w-full flex-col border-r border-l max-[500px]:pb-16">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Compte
      </h1>
      {/* This div will now manage the layout for UserProfile */}
      <div className="flex-1 overflow-y-auto p-4 px-2 max-sm:mx-auto md:p-4">
        <UserProfile
          path="/account"
          routing="path"
          appearance={{
            elements: {
              card: "w-full max-w-none shadow-none border-none",
            },
          }}
        />
      </div>
    </main>
  )
}

export default AccountPage
