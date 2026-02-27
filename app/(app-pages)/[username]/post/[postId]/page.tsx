import { preloadQuery, preloadedQueryResult } from "convex/nextjs"
import { notFound, redirect } from "next/navigation"
import { getAuthToken } from "@/app/auth"
import { PostLayout } from "@/components/domains/posts"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

const PostDetailsPage = async (props: {
  params: Promise<{ username: string; postId: Id<"posts"> }>
}) => {
  const params = await props.params
  const token = await getAuthToken()
  const currentUser = preloadedQueryResult(
    await preloadQuery(api.users.getCurrentUser, undefined, { token }),
  )

  if (!currentUser?.username) redirect("/onboarding")

  const [preloadedProfile, preloadedPost] = await Promise.all([
    preloadQuery(api.users.getUserProfile, { username: params.username }, { token }),
    preloadQuery(api.posts.getPost, { postId: params.postId }),
  ])

  const userProfile = preloadedQueryResult(preloadedProfile)
  if (userProfile === null) notFound()

  const post = preloadedQueryResult(preloadedPost)
  if (post === null) notFound()

  return <PostLayout currentUser={currentUser} preloadedPost={preloadedPost} />
}

export default PostDetailsPage
