import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { ProfilePage } from "../pages/profile.page"
import { TipDialog } from "../pages/tip-dialog"

const CREATOR_USERNAME = process.env.E2E_CREATOR_USERNAME ?? ""

test.describe("Pourboire (mode test)", () => {
  test.describe.configure({ mode: "serial" })

  test.beforeEach(async ({ page }) => {
    test.skip(!CREATOR_USERNAME, "E2E_CREATOR_USERNAME non défini")
    await setupClerkTestingToken({ page })
  })

  test("ouvrir le dialogue de pourboire depuis le profil", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    await profile.tipButton.click()

    const tip = new TipDialog(page)
    await tip.waitForOpen()
  })

  test("sélectionner un preset de montant", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    await profile.tipButton.click()

    const tip = new TipDialog(page)
    await tip.waitForOpen()
    await tip.selectPreset(1000)
  })

  test("sélectionner un montant personnalisé", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    await profile.tipButton.click()

    const tip = new TipDialog(page)
    await tip.waitForOpen()
    await tip.selectCustom()
    await tip.fillCustomAmount("2500")
  })

  test("ajouter un message optionnel", async ({ page }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    await profile.tipButton.click()

    const tip = new TipDialog(page)
    await tip.waitForOpen()
    await tip.selectPreset(500)
    await tip.fillMessage("Merci pour ton contenu !")
  })

  test("simuler un paiement pourboire redirige vers le résultat", async ({
    page,
  }) => {
    const profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()

    await profile.tipButton.click()

    const tip = new TipDialog(page)
    await tip.waitForOpen()
    await tip.selectPreset(500)
    await tip.clickPayMobile()

    await page.waitForURL(/\/payment\/result/, { timeout: 15_000 })
    await expect(page.locator("#main-content")).toBeVisible()
  })
})
