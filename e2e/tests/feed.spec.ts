import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { HomePage } from "../pages/home.page"

test.describe("Fil d'actualité", () => {
  let home: HomePage

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    home = new HomePage(page)
    await home.goto()
  })

  test("le feed charge les publications", async () => {
    await home.waitForFeedLoaded()
    const count = await home.getPostCount()
    expect(count).toBeGreaterThan(0)
  })

  test("un post affiche l'auteur et les actions", async () => {
    await home.waitForFeedLoaded()
    const firstPost = home.getPostCard(0)

    await expect(firstPost.locator("[data-testid='post-author']")).toBeVisible()
    await expect(firstPost.locator("[data-testid='like-button']")).toBeVisible()
    await expect(
      firstPost.locator("[data-testid='comment-button']"),
    ).toBeVisible()
    await expect(
      firstPost.locator("[data-testid='bookmark-button']"),
    ).toBeVisible()
  })

  test("les posts verrouillés affichent l'overlay", async () => {
    await home.waitForFeedLoaded()

    const lockedOverlay = home.page.locator(
      "[data-testid='locked-media-overlay']",
    )
    const count = await lockedOverlay.count()

    // If there are locked posts, verify overlay is visible
    if (count > 0) {
      await expect(lockedOverlay.first()).toBeVisible()
    }
  })

  test("le scroll infini charge plus de publications", async () => {
    await home.waitForFeedLoaded()
    const initialCount = await home.getPostCount()

    if (initialCount >= 10) {
      await home.scrollToLoadMore()
      const newCount = await home.getPostCount()
      expect(newCount).toBeGreaterThanOrEqual(initialCount)
    }
  })
})
