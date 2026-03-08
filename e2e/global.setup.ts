import path from "path"

import { clerk, clerkSetup } from "@clerk/testing/playwright"
import { test as setup } from "@playwright/test"

setup.describe.configure({ mode: "serial" })

setup("clerk setup", async () => {
  await clerkSetup()
})

const userAuthFile = path.join(__dirname, ".auth/user.json")

setup("authenticate as user", async ({ page }) => {
  await page.goto("/")
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  })
  await page.waitForURL("**/*", { timeout: 15_000 })
  await page.context().storageState({ path: userAuthFile })
})

const creatorAuthFile = path.join(__dirname, ".auth/creator.json")

setup("authenticate as creator", async ({ page }) => {
  if (
    !process.env.E2E_CLERK_CREATOR_USERNAME ||
    !process.env.E2E_CLERK_CREATOR_PASSWORD
  ) {
    console.log("Skipping creator auth — env vars not set")
    return
  }
  await page.goto("/")
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_CREATOR_USERNAME!,
      password: process.env.E2E_CLERK_CREATOR_PASSWORD!,
    },
  })
  await page.waitForURL("**/*", { timeout: 15_000 })
  await page.context().storageState({ path: creatorAuthFile })
})

const adminAuthFile = path.join(__dirname, ".auth/admin.json")

setup("authenticate as admin", async ({ page }) => {
  if (
    !process.env.E2E_CLERK_ADMIN_USERNAME ||
    !process.env.E2E_CLERK_ADMIN_PASSWORD
  ) {
    console.log("Skipping admin auth — env vars not set")
    return
  }
  await page.goto("/")
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_ADMIN_USERNAME!,
      password: process.env.E2E_CLERK_ADMIN_PASSWORD!,
    },
  })
  await page.waitForURL("**/*", { timeout: 15_000 })
  await page.context().storageState({ path: adminAuthFile })
})
