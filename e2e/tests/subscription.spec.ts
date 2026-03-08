import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { TOAST } from "../helpers/selectors"
import { ProfilePage } from "../pages/profile.page"
import { SubscriptionDialog } from "../pages/subscription-dialog"

const CREATOR_USERNAME = process.env.E2E_CREATOR_USERNAME ?? ""

test.describe("Abonnement (mode test)", () => {
  test.describe.configure({ mode: "serial" })

  test.beforeEach(async ({ page }) => {
    test.skip(!CREATOR_USERNAME, "E2E_CREATOR_USERNAME non défini")
    await setupClerkTestingToken({ page })
  })

  test("se désabonner si déjà abonné", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    const btnText = await profile.subscriptionButton.textContent()

    if (!btnText?.includes("ABONNÉ")) {
      test.skip()
      return
    }

    // Already subscribed — unsubscribe first
    await profile.subscriptionButton.click()

    const dialog = new SubscriptionDialog(page)
    await dialog.waitForUnsubscribeOpen()
    await dialog.clickUnsubscribe()

    await profile.expectToast(TOAST.SUBSCRIPTION_CANCELLED)

    // Button should now show S'ABONNER
    await expect(profile.subscriptionButton.getByText("S'ABONNER")).toBeVisible(
      { timeout: 10_000 },
    )
  })

  test("ouvrir le dialogue d'abonnement depuis le profil", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    await profile.subscriptionButton.click()

    const dialog = new SubscriptionDialog(page)
    await dialog.waitForOpen()
  })

  test("le dialogue affiche le prix et les avantages", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    await profile.subscriptionButton.click()

    const dialog = new SubscriptionDialog(page)
    await dialog.waitForOpen()
    await dialog.expectPriceVisible()
    await dialog.expectFeaturesVisible()

    await expect(dialog.payMobileButton).toBeVisible()
    await expect(dialog.payCardButton).toBeVisible()
  })

  test("simuler un paiement mobile redirige vers le résultat", async ({
    page,
  }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    await profile.subscriptionButton.click()

    const dialog = new SubscriptionDialog(page)
    await dialog.waitForOpen()
    await dialog.clickPayMobile()

    // Should redirect to payment result page
    await page.waitForURL(/\/payment\/result/, { timeout: 15_000 })
    await expect(page.locator("#main-content")).toBeVisible()
  })
})
