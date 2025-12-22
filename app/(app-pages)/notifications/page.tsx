import { getAuthToken } from "@/app/auth"
import { NotificationsLayout } from "@/components/domains/notifications"

const NotificationsPage = async () => {
  await getAuthToken()

  return <NotificationsLayout />
}

export default NotificationsPage
