import { type Page, expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class NotificationsPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto("/notifications")
  }

  async waitForLoaded() {
    await expect(
      this.page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible({ timeout: 15_000 })
  }

  get notificationItems() {
    return this.page.locator("[data-testid='notification-item']")
  }

  async selectFilter(label: string) {
    // Open filter dropdown
    await this.page
      .getByRole("button", {
        name: /Tous|J'aime|Commentaires|Abonnements|Suiveurs|Publications|Pourboires/,
      })
      .first()
      .click()
    // Click the filter option
    await this.page.getByRole("button", { name: label }).click()
  }

  async clickFirstNotification() {
    await this.notificationItems.first().click()
  }

  async getNotificationCount() {
    return this.notificationItems.count()
  }
}
