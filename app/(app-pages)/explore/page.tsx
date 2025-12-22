import { getAuthToken } from "@/app/auth"
import { ExploreLayout } from "@/components/explore/explore-layout"

const ExplorePage = async () => {
  await getAuthToken()
  return <ExploreLayout />
}

export default ExplorePage
