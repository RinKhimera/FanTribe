import { SplitPanelLayout } from "@/components/layout/split-panel-layout"
import { UserListsNavigationLinks } from "@/components/shared/user-lists-navigation-links"

export default function UserListsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SplitPanelLayout
      title="Abonnements"
      navigationPanel={<UserListsNavigationLinks />}
    >
      {children}
    </SplitPanelLayout>
  )
}
