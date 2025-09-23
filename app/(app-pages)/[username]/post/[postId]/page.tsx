import { fetchQuery } from "convex/nextjs"
import { notFound, redirect } from "next/navigation"
import { getAuthToken } from "@/app/auth"
import { PostLayout } from "@/components/post/post-layout"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

const PostDetailsPage = async (props: {
  params: Promise<{ username: string; postId: Id<"posts"> }>
}) => {
  const params = await props.params
  const token = await getAuthToken()
  const currentUser = await fetchQuery(api.users.getCurrentUser, undefined, {
    token,
  })

  if (!currentUser?.username) redirect("/onboarding")

  const userProfile = await fetchQuery(api.users.getUserProfile, {
    username: params.username,
  })

  if (userProfile === null) notFound()

  const post = await fetchQuery(api.posts.getPost, {
    postId: params.postId,
  })
  if (post === null) notFound()

  return <PostLayout currentUser={currentUser} postId={params.postId} />
}

export default PostDetailsPage
