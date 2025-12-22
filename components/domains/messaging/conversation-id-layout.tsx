import { ConversationContent } from "./conversation-content"
import { ConversationsList } from "./conversations-list"
import { UserListDialog } from "./user-list-dialog"

export const ConversationIdLayout = () => {
  return (
    <main className="border-muted flex h-screen w-full flex-col border-r border-l max-[500px]:pb-16">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Messages
      </h1>

      <div className="flex flex-1 overflow-auto">
        <div className="border-muted hidden h-full w-2/5 flex-col border-r lg:flex">
          <div className="border-muted flex items-center justify-between border-b p-4 text-lg font-bold">
            <div>Mes conversations</div>
            <UserListDialog />
          </div>

          <div className="flex-1 overflow-auto">
            <ConversationsList />
          </div>
        </div>

        <ConversationContent />
      </div>
    </main>
  )
}
