import { type Page, expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto("/dashboard")
  }

  async waitForLoaded() {
    await expect(
      this.page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible({ timeout: 15_000 })
  }

  get kpiCards() {
    return this.page.locator("[data-testid='kpi-card']")
  }

  async clickTab(label: string) {
    await this.page.getByRole("link", { name: label, exact: true }).click()
    await this.page.waitForLoadState("domcontentloaded")
  }
}
