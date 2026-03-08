import { type Page, expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto(username: string) {
    await super.goto(`/${username}`)
  }

  async waitForProfileLoaded() {
    await expect(this.page.locator("h2").first()).toBeVisible({
      timeout: 15_000,
    })
  }

  get followButton() {
    return this.page.locator("[data-testid='follow-button']")
  }

  get subscriptionButton() {
    return this.page.locator("[data-testid='subscription-button']")
  }

  get tipButton() {
    return this.page.getByRole("button", { name: "Envoyer un pourboire" })
  }

  async clickTab(label: "Publications" | "Médias" | "J'aime" | "Abonnements") {
    await this.page.getByRole("link", { name: label }).click()
    await this.page.waitForLoadState("domcontentloaded")
  }

  async getDisplayName() {
    return this.page.locator("h2").first().textContent()
  }

  async isBlockedStateVisible() {
    return this.page.getByText("Vous avez bloqué").isVisible()
  }
}
