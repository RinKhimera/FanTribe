import { type Page, expect } from "@playwright/test"
import { EXPLORE } from "../helpers/selectors"
import { BasePage } from "./base.page"

export class ExplorePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto("/explore")
  }

  get searchInput() {
    return this.page.getByPlaceholder(EXPLORE.SEARCH_PLACEHOLDER)
  }

  async waitForLoaded() {
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    })
  }

  async search(term: string) {
    await this.searchInput.fill(term)
    await this.page.waitForTimeout(500)
  }

  async clearSearch() {
    await this.page.getByLabel("Effacer la recherche").click()
  }

  async selectSort(mode: "Récents" | "Tendances") {
    await this.page.getByRole("button", { name: mode }).click()
  }

  get exploreFeed() {
    return this.page.locator("[data-testid='explore-feed']")
  }
}
