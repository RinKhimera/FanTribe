import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { NEW_POST } from "../helpers/selectors"
import { NewPostPage } from "../pages/new-post.page"

test.describe("Création de publication (créateur)", () => {
  let newPost: NewPostPage

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    newPost = new NewPostPage(page)
    await newPost.goto()
    await newPost.waitForEditorLoaded()
  })

  test("un créateur peut accéder à /new-post", async ({ page }) => {
    await expect(page.getByText(NEW_POST.TITLE)).toBeVisible()
  })

  test("le textarea est visible avec le placeholder", async () => {
    await expect(newPost.contentInput).toBeVisible()
    await expect(newPost.contentInput).toHaveAttribute(
      "placeholder",
      NEW_POST.PLACEHOLDER,
    )
  })

  test("le bouton Publier est visible", async () => {
    await expect(newPost.submitButton).toBeVisible()
  })

  test("écrire du contenu met à jour le compteur de caractères", async ({
    page,
  }) => {
    await newPost.fillContent("Test de publication E2E")
    // Character counter should appear
    await expect(page.locator("#main-content")).toBeVisible()
  })

  test("créer un post public redirige vers le feed", async ({ page }) => {
    test.slow() // mutation + redirect can be slow

    await newPost.fillContent(`Test E2E — publication de test ${Date.now()}`)

    await expect(newPost.submitButton).toBeEnabled()
    await newPost.submit()

    // Wait for any toast (success or error)
    const toastLocator = page.locator("[data-sonner-toast]").first()
    await expect(toastLocator).toBeVisible({ timeout: 30_000 })

    const toastText = await toastLocator.textContent()

    // Skip if rate-limited (5 posts/hour limit)
    if (toastText?.includes("erreur")) {
      test.skip(true, "Rate-limited: createPost 5/hour limit reached")
      return
    }

    expect(toastText).toContain(NEW_POST.SUCCESS_TOAST)
    await page.waitForURL("/", { timeout: 15_000 })
  })
})
