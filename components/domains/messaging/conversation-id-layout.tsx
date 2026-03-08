import { ConversationContent } from "./conversation-content"
import { ConversationsList } from "./conversations-list"
import { UserListDialog } from "./user-list-dialog"

export const ConversationIdLayout = () => {
  return (
    <main className="border-muted flex min-h-screen w-full flex-col border-r border-l max-[500px]:pb-16 min-[501px]:h-screen">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Messages
      </h1>

      <div className="flex flex-1 min-[501px]:overflow-hidden">
        <div className="border-muted hidden w-2/5 flex-col border-r min-[501px]:overflow-y-auto lg:flex">
          <div className="border-muted flex items-center justify-between border-b px-4 py-3 text-lg font-bold">
            <div>Mes conversations</div>
            <UserListDialog />
          </div>

          <div className="flex-1 min-[501px]:overflow-auto">
            <ConversationsList />
          </div>
        </div>

        <ConversationContent />
      </div>
    </main>
  )
}
