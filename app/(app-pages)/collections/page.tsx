import { getAuthToken } from "@/app/auth"
import { CollectionsLayout } from "@/components/collections/collections-layout"

const CollectionsPage = async () => {
  await getAuthToken()

  return <CollectionsLayout />
}

export default CollectionsPage
