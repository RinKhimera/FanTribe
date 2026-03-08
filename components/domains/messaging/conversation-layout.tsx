import { SplitPanelLayout } from "@/components/layout/split-panel-layout"
import { ConversationsList } from "./conversations-list"
import { EmptyConversation } from "./empty-conversation"
import { UserListDialog } from "./user-list-dialog"

export const ConversationLayout = () => {
  return (
    <SplitPanelLayout
      title="Messages"
      showNavigationOnMobile
      navigationPanel={
        <>
          <div className="border-muted flex items-center justify-between border-b px-4 py-3 text-lg font-bold">
            <div>Mes conversations</div>
            <UserListDialog />
          </div>
          <ConversationsList />
        </>
      }
    >
      <EmptyConversation />
    </SplitPanelLayout>
  )
}
