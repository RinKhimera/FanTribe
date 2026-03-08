import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

const CREATOR_USERNAME = process.env.E2E_CREATOR_USERNAME ?? ""

test.describe("Édition de profil (créateur)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!CREATOR_USERNAME, "E2E_CREATOR_USERNAME non défini")
    await setupClerkTestingToken({ page })
  })

  test("la page d'édition charge", async ({ page }) => {
    await page.goto(`/${CREATOR_USERNAME}/edit`)
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 15_000 })
  })

  test("les champs sont pré-remplis", async ({ page }) => {
    await page.goto(`/${CREATOR_USERNAME}/edit`)
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 15_000 })

    // Name or bio input should have content
    const nameInput = page.getByLabel("Nom")
    if (await nameInput.isVisible()) {
      const value = await nameInput.inputValue()
      expect(value).toBeTruthy()
    }
  })
})
