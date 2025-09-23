import { getAuthToken } from "@/app/auth"
import { NotificationsLayout } from "@/components/notifications/notification-layout"

const NotificationsPage = async () => {
  const token = await getAuthToken()

  return <NotificationsLayout />
}

export default NotificationsPage
