import { type Locator, type Page, expect } from "@playwright/test"

export class BasePage {
  readonly page: Page
  readonly sidebar: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.locator("[data-testid='sidebar']")
  }

  async goto(path: string) {
    await this.page.goto(path)
  }

  /** Navigate via sidebar link (French text) */
  async navigateVia(linkText: string) {
    await this.sidebar.getByRole("link", { name: linkText }).click()
    await this.page.waitForLoadState("domcontentloaded")
  }

  /** Wait for Convex data — use a visible element selector, NOT networkidle */
  async waitForData(selector: string, timeout = 15_000) {
    await this.page.waitForSelector(selector, { timeout })
  }

  /** Assert a toast (sonner) is visible */
  async expectToast(message: string) {
    await expect(
      this.page.locator("[data-sonner-toast]").filter({ hasText: message }),
    ).toBeVisible({ timeout: 5_000 })
  }
}
