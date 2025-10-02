/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
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
import type * as likes from "../likes.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as reports from "../reports.js";
import type * as subscriptions from "../subscriptions.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as validationDocuments from "../validationDocuments.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
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
  likes: typeof likes;
  messages: typeof messages;
  notifications: typeof notifications;
  posts: typeof posts;
  reports: typeof reports;
  subscriptions: typeof subscriptions;
  transactions: typeof transactions;
  users: typeof users;
  validationDocuments: typeof validationDocuments;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
