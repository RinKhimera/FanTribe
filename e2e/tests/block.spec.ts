import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { TOAST } from "../helpers/selectors"
import { ProfilePage } from "../pages/profile.page"

const CREATOR_USERNAME = process.env.E2E_CREATOR_USERNAME ?? ""

test.describe("Blocage utilisateur", () => {
  test.describe.configure({ mode: "serial" })

  test.beforeEach(async ({ page }) => {
    test.skip(!CREATOR_USERNAME, "E2E_CREATOR_USERNAME non défini")
    await setupClerkTestingToken({ page })
  })

  test("débloquer si déjà bloqué (nettoyage)", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)

    // Wait for page to settle
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2_000)

    const unblockButton = page.getByRole("button", { name: /Débloquer/ })
    const isBlocked = await unblockButton.isVisible()

    if (!isBlocked) {
      test.skip(true, "Utilisateur non bloqué — nettoyage non nécessaire")
      return
    }

    await unblockButton.click()
    // Confirm unblock in dialog
    const confirmButton = page.getByRole("button", { name: /Débloquer/ })
    await confirmButton.click()
    await profile.expectToast(TOAST.USER_UNBLOCKED)

    // Wait for profile to reload
    await profile.waitForProfileLoaded()
  })

  test("bloquer un utilisateur via le profil", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    // Open profile actions menu (vertical ellipsis)
    const moreButton = page.getByRole("button", {
      name: "Actions du profil",
    })
    await moreButton.click()

    const blockOption = page.getByText("Bloquer", { exact: true })
    await blockOption.click()

    // Confirm block dialog
    const confirmButton = page.getByRole("button", {
      name: "Bloquer",
      exact: true,
    })
    await confirmButton.click()
    await profile.expectToast(TOAST.USER_BLOCKED)
  })

  test("le profil bloqué affiche l'état bloqué", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)

    await expect(page.getByText("Vous avez bloqué")).toBeVisible({
      timeout: 10_000,
    })
  })

  test("débloquer un utilisateur depuis le profil", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)

    const unblockButton = page.getByRole("button", { name: /Débloquer/ })
    await expect(unblockButton).toBeVisible({ timeout: 10_000 })
    await unblockButton.click()

    // Confirm dialog
    const confirmButton = page.getByRole("button", { name: /Débloquer/ })
    await confirmButton.click()
    await profile.expectToast(TOAST.USER_UNBLOCKED)
  })
})
