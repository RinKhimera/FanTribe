import { type Page, expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto("/")
  }

  get feed() {
    return this.page.locator("[data-testid='news-feed']")
  }

  async waitForFeedLoaded() {
    await expect(this.getPostCards().first()).toBeVisible({ timeout: 15_000 })
  }

  async getPostCount() {
    return this.getPostCards().count()
  }

  async isEmptyFeedShown() {
    return this.page.getByText("Aucune publication").isVisible()
  }

  async scrollToLoadMore() {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight),
    )
    await this.page.waitForTimeout(1_000)
  }
}
