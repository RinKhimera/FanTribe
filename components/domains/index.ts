/**
 * Domain Components
 *
 * Organisation par domaine métier pour FanTribe.
 * Chaque domaine contient les composants spécifiques à sa logique.
 *
 * @example
 * import { NewsFeed, CreatePost } from "@/components/domains/posts"
 * import { ConversationLayout } from "@/components/domains/messaging"
 */

// Re-export all domains
export * from "./posts"
export * from "./messaging"
export * from "./subscriptions"
export * from "./notifications"
export * from "./users"
