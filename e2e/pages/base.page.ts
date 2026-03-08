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

  /** Get all post cards on the page */
  getPostCards() {
    return this.page.locator("[data-testid='post-card']")
  }

  /** Get the nth post card */
  getPostCard(index: number) {
    return this.getPostCards().nth(index)
  }

  /** Assert a toast (sonner) is visible */
  async expectToast(message: string) {
    await expect(
      this.page.locator("[data-sonner-toast]").filter({ hasText: message }),
    ).toBeVisible({ timeout: 5_000 })
  }

  /** Close any open dialog by pressing Escape */
  async closeAllDialogs() {
    await this.page.keyboard.press("Escape")
  }

  /** Scope selectors to main content area (avoids sidebar matches) */
  get main() {
    return this.page.locator("#main-content")
  }
}
