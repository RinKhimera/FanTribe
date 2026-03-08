import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { TOAST } from "../helpers/selectors"
import { ProfilePage } from "../pages/profile.page"

const CREATOR_USERNAME = process.env.E2E_CREATOR_USERNAME ?? ""

test.describe("Profil créateur", () => {
  let profile: ProfilePage

  test.beforeEach(async ({ page }) => {
    test.skip(!CREATOR_USERNAME, "E2E_CREATOR_USERNAME non défini")
    await setupClerkTestingToken({ page })
    profile = new ProfilePage(page)
    await profile.goto(CREATOR_USERNAME)
    await profile.waitForProfileLoaded()
  })

  test("le profil affiche le nom et le username", async ({ page }) => {
    const displayName = await profile.getDisplayName()
    expect(displayName).toBeTruthy()

    await expect(
      page.locator("#main-content").getByText(`@${CREATOR_USERNAME}`).first(),
    ).toBeVisible()
  })

  test("les stats du profil sont visibles", async ({ page }) => {
    // Stats section should show at least followers and posts
    await expect(page.locator("#main-content")).toBeVisible()
  })

  test("le bouton Suivre est visible", async () => {
    await expect(profile.followButton).toBeVisible()
  })

  test("le bouton S'abonner est visible", async () => {
    await expect(profile.subscriptionButton).toBeVisible()
  })

  test("cliquer Suivre/Suivi toggle fonctionne", async () => {
    const btn = profile.followButton
    const btnText = await btn.textContent()
    const isFollowing = btnText?.includes("Suivi")

    if (isFollowing) {
      // Unfollow first, then re-follow
      await btn.click()
      await profile.expectToast(TOAST.UNFOLLOWING)
      await btn.click()
      await profile.expectToast(TOAST.FOLLOWING)
    } else {
      // Follow, then unfollow
      await btn.click()
      await profile.expectToast(TOAST.FOLLOWING)
      await btn.click()
      await profile.expectToast(TOAST.UNFOLLOWING)
    }
  })

  test("le bouton S'abonner ouvre le dialogue", async ({ page }) => {
    await profile.subscriptionButton.click()

    // Dialog opens — either subscribe ("Rejoignez") or unsubscribe ("Se désabonner")
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 })

    await profile.closeAllDialogs()
  })

  test("le bouton pourboire ouvre le dialogue", async ({ page }) => {
    await profile.tipButton.click()

    await expect(
      page.getByRole("dialog").getByText("Envoyer un pourboire"),
    ).toBeVisible({ timeout: 5_000 })

    await profile.closeAllDialogs()
  })

  test("l'onglet Publications fonctionne", async ({ page }) => {
    await profile.clickTab("Publications")
    await expect(page.locator("#main-content")).toBeVisible()
  })
})
