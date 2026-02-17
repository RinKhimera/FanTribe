import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/auth/", "/terms", "/privacy", "/cookies"],
      disallow: [
        "/messages/",
        "/notifications/",
        "/superuser/",
        "/dashboard/",
        "/payment/",
        "/subscriptions/",
        "/collections/",
        "/new-post/",
        "/onboarding/",
        "/account/",
        "/explore/",
        "/be-creator/",
      ],
    },
  }
}
