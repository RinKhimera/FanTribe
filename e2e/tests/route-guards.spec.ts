import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

test.describe("Guards de routes — accès USER", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test("USER est redirigé depuis /dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"), {
      timeout: 15_000,
    })
    expect(page.url()).not.toContain("/dashboard")
  })

  test("USER est redirigé depuis /new-post", async ({ page }) => {
    await page.goto("/new-post")
    await page.waitForURL((url) => !url.pathname.startsWith("/new-post"), {
      timeout: 15_000,
    })
    expect(page.url()).not.toContain("/new-post")
  })

  test("USER ne peut pas accéder à /superuser", async ({ page }) => {
    await page.goto("/superuser")
    await page.waitForURL((url) => !url.pathname.startsWith("/superuser"), {
      timeout: 15_000,
    })
    expect(page.url()).not.toContain("/superuser")
  })
})
