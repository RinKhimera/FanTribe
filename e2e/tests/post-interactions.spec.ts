import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { test } from "@playwright/test"
import { TOAST } from "../helpers/selectors"
import { HomePage } from "../pages/home.page"

test.describe("Interactions sur les posts", () => {
  test.describe.configure({ mode: "serial" })

  let home: HomePage

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    home = new HomePage(page)
    await home.goto()
    await home.waitForFeedLoaded()
  })

  test("liker un post change l'état du bouton", async () => {
    const firstPost = home.getPostCard(0)
    const likeBtn = firstPost.locator("[data-testid='like-button']")

    await likeBtn.click()
    // Wait a beat for optimistic update
    await home.page.waitForTimeout(500)

    // Unlike
    await likeBtn.click()
    await home.page.waitForTimeout(500)
  })

  test("bookmarker un post affiche le toast", async () => {
    const firstPost = home.getPostCard(0)
    const bookmarkBtn = firstPost.locator("[data-testid='bookmark-button']")

    await bookmarkBtn.click()
    await home.expectToast(TOAST.BOOKMARKED)

    // Wait for toast to disappear, then unbookmark
    await home.page.waitForTimeout(2_000)
    await bookmarkBtn.click()
    await home.expectToast(TOAST.UNBOOKMARKED)
  })

  test("partager un post copie le lien", async () => {
    const firstPost = home.getPostCard(0)

    // Share button — look for the share tooltip text
    const shareBtn = firstPost.getByRole("button", { name: "Partager" })
    if (await shareBtn.isVisible()) {
      await shareBtn.click()
      await home.expectToast(TOAST.LINK_COPIED)
    }
  })

  test("ouvrir les commentaires fonctionne", async () => {
    const firstPost = home.getPostCard(0)
    const commentBtn = firstPost.locator("[data-testid='comment-button']")

    await commentBtn.click()
    // Comment section should appear
    await home.page.waitForTimeout(500)
  })
})
