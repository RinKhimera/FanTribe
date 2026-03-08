import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

test.describe("Pages publiques", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test("la page d'accueil se charge", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/FanTribe/)
  })

  test("la page explore affiche les créateurs", async ({ page }) => {
    await page.goto("/explore")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    })
  })

  test("les pages légales se chargent", async ({ page }) => {
    await page.goto("/terms")
    await expect(page.locator("main")).toBeVisible()

    await page.goto("/privacy")
    await expect(page.locator("main")).toBeVisible()
  })
})
