import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter"
import { components } from "../_generated/api"

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Messagerie : 10 messages/min par user, burst de 5
  sendMessage: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 5,
  },

  // Création de posts : 5/heure par user
  createPost: {
    kind: "fixed window",
    rate: 5,
    period: HOUR,
  },

  // Commentaires : 20/min par user
  addComment: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 5,
  },

  // Signalements : 10/heure par user (éviter spam de reports)
  createReport: {
    kind: "fixed window",
    rate: 10,
    period: HOUR,
  },

  // Likes : 30/min par user
  likePost: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 10,
  },

  // Follows : 30/min par user
  followUser: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 10,
  },

  // Réactions messages : 20/min par user
  toggleReaction: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 5,
  },

  // Pourboires : 5/heure par user (éviter spam de tips)
  sendTip: {
    kind: "fixed window",
    rate: 5,
    period: HOUR,
  },
})
