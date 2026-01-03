/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assetsDraft from "../assetsDraft.js";
import type * as blocks from "../blocks.js";
import type * as bookmarks from "../bookmarks.js";
import type * as comments from "../comments.js";
import type * as conversations from "../conversations.js";
import type * as creatorApplications from "../creatorApplications.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as internalActions from "../internalActions.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_batch from "../lib/batch.js";
import type * as lib_blocks from "../lib/blocks.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_notifications from "../lib/notifications.js";
import type * as lib_signedUrls from "../lib/signedUrls.js";
import type * as lib_subscriptions from "../lib/subscriptions.js";
import type * as likes from "../likes.js";
import type * as messages from "../messages.js";
import type * as notificationQueue from "../notificationQueue.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as reports from "../reports.js";
import type * as subscriptions from "../subscriptions.js";
import type * as superuser from "../superuser.js";
import type * as transactions from "../transactions.js";
import type * as userStats from "../userStats.js";
import type * as users from "../users.js";
import type * as validationDocuments from "../validationDocuments.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assetsDraft: typeof assetsDraft;
  blocks: typeof blocks;
  bookmarks: typeof bookmarks;
  comments: typeof comments;
  conversations: typeof conversations;
  creatorApplications: typeof creatorApplications;
  crons: typeof crons;
  files: typeof files;
  http: typeof http;
  internalActions: typeof internalActions;
  "lib/auth": typeof lib_auth;
  "lib/batch": typeof lib_batch;
  "lib/blocks": typeof lib_blocks;
  "lib/errors": typeof lib_errors;
  "lib/index": typeof lib_index;
  "lib/notifications": typeof lib_notifications;
  "lib/signedUrls": typeof lib_signedUrls;
  "lib/subscriptions": typeof lib_subscriptions;
  likes: typeof likes;
  messages: typeof messages;
  notificationQueue: typeof notificationQueue;
  notifications: typeof notifications;
  posts: typeof posts;
  reports: typeof reports;
  subscriptions: typeof subscriptions;
  superuser: typeof superuser;
  transactions: typeof transactions;
  userStats: typeof userStats;
  users: typeof users;
  validationDocuments: typeof validationDocuments;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
