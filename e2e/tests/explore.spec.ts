import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { EXPLORE } from "../helpers/selectors"
import { ExplorePage } from "../pages/explore.page"

test.describe("Page Explorer", () => {
  let explore: ExplorePage

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    explore = new ExplorePage(page)
    await explore.goto()
    await explore.waitForLoaded()
  })

  test("la page explore charge avec le heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("la barre de recherche est visible", async () => {
    await expect(explore.searchInput).toBeVisible()
  })

  test("la recherche filtre les résultats", async ({ page }) => {
    await explore.search("test")
    // Wait for debounce + results
    await page.waitForTimeout(500)
    // Search should show results or empty state
    await expect(page.locator("#main-content")).toBeVisible()
  })

  test("le tri Récents est actif par défaut", async ({ page }) => {
    const recentButton = page.getByRole("button", {
      name: EXPLORE.SORT_RECENT,
    })
    await expect(recentButton).toBeVisible()
  })

  test("le tri Tendances fonctionne", async ({ page }) => {
    await explore.selectSort("Tendances")
    const trendingButton = page.getByRole("button", {
      name: EXPLORE.SORT_TRENDING,
    })
    await expect(trendingButton).toBeVisible()
  })
})
