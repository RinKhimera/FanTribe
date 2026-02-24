"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { env } from "@/lib/config/env"
import { stripe } from "@/lib/services/stripe"

const baseUrl =
  env.NODE_ENV === "production"
    ? "https://fantribe.io"
    : "http://localhost:3000"

export async function startStripeTipCheckout(params: {
  senderId: string
  creatorId: string
  creatorUsername: string
  amount: number
  tipMessage?: string
  context?: "post" | "profile" | "message"
  postId?: string
  conversationId?: string
}) {
  const [{ userId }, user] = await Promise.all([auth(), currentUser()])

  if (!userId || !user) {
    return { error: "Unauthorized" }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    client_reference_id: userId,
    customer_email: user.emailAddresses?.[0]?.emailAddress,
    line_items: [
      {
        price_data: {
          currency: "xaf",
          product_data: {
            name: `Pourboire pour @${params.creatorUsername}`,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "tip",
      senderId: params.senderId,
      creatorId: params.creatorId,
      creatorUsername: params.creatorUsername,
      tipMessage: params.tipMessage || "",
      tipContext: params.context || "",
      postId: params.postId || "",
      conversationId: params.conversationId || "",
    },
    success_url: `${baseUrl}/payment/merci?provider=stripe&type=tip&session_id={CHECKOUT_SESSION_ID}&username=${params.creatorUsername}`,
    cancel_url: `${baseUrl}/payment/cancelled?provider=stripe&type=tip&reason=cancelled&username=${params.creatorUsername}`,
  })

  if (session.url) {
    redirect(session.url)
  }
}
