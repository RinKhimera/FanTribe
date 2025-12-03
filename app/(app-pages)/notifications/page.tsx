import { getAuthToken } from "@/app/auth"
import { NotificationsLayout } from "@/components/notifications/notification-layout"

const NotificationsPage = async () => {
  await getAuthToken()

  return <NotificationsLayout />
}

export default NotificationsPage
